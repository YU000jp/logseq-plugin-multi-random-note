import '@logseq/libs' //https://plugins-doc.logseq.com/
import { AppInfo, BlockEntity, LSPluginBaseInfo, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { generateEmbed, generateEmbedForAssets } from './embed/generateBlock'
import { addLeftMenuNavHeader, clearEle } from './embed/lib'
import cssMain from './main.css?inline'
import cssMainDbModel from './mainDb.css?inline'
import { keySettingsPageStyle, settingsTemplate, styleList } from './settings'
import af from "./translations/af.json"
import de from "./translations/de.json"
import es from "./translations/es.json"
import fr from "./translations/fr.json"
import id from "./translations/id.json"
import it from "./translations/it.json"
import ja from "./translations/ja.json"
import ko from "./translations/ko.json"
import nbNO from "./translations/nb-NO.json"
import nl from "./translations/nl.json"
import pl from "./translations/pl.json"
import ptBR from "./translations/pt-BR.json"
import ptPT from "./translations/pt-PT.json"
import ru from "./translations/ru.json"
import sk from "./translations/sk.json"
import tr from "./translations/tr.json"
import uk from "./translations/uk.json"
import zhCN from "./translations/zh-CN.json"
import zhHant from "./translations/zh-Hant.json"
import { getUuidFromPageName } from './advancedQuery'

export const mainPageTitle = "Multi-Random-Note-Plugin" // メインページのタイトル
export const mainPageTitleLower = mainPageTitle.toLowerCase()
export const shortKey = "mrn"
const keyCssMain = "main"
const keyToolbar = "Multi-Random-Note"
const keyPageBarId = `${shortKey}--pagebar`
const toolbarIcon = "🎯"
const keyToggleButton = `${shortKey}--changeStyleToggle`
const keySettingsButton = `${shortKey}--pluginSettings`
const keyRunButton = `${shortKey}--run`
const keyAssetsButton = `${shortKey}--assets`
const keyCloseButton = `${shortKey}--close`
const keyLeftMenu = `${shortKey}--nav-header`
let logseqVersion: string = "" //バージョンチェック用
let logseqVersionMd: boolean = false //バージョンチェック用
let logseqDbGraph: boolean = false //DBグラフかどうかのフラグ


/* main */
const main = async () => {

  // バージョンチェック
  logseqVersionMd = await checkLogseqVersion()
  // if (logseqVersionMd === false) {
  //   // Logseq ver 0.10.*以下にしか対応していない
  //   logseq.UI.showMsg("The Multi Random Note plugin only supports Logseq ver 0.10.* and below.", "warning", { timeout: 5000 })
  //   return
  // }
  if (logseqVersionMd === false) {
    logseqDbGraph = await checkLogseqDbGraph()
    console.log(`${logseqDbGraph ? "DB Graph" : "MD Graph"} mode detected.`)
  }

  // l10nのセットアップ
  await l10nSetup({
    builtinTranslations: {//Full translations
      ja, af, de, es, fr, id, it, ko, "nb-NO": nbNO, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ru, sk, tr, uk, "zh-CN": zhCN, "zh-Hant": zhHant
    }
  })

  /* user settings */
  logseq.useSettingsSchema(settingsTemplate())


  // ツールバーにボタンを追加
  logseq.App.registerUIItem('toolbar', {
    key: keyToolbar,
    template: `
    <div>
      <a class="button icon" data-on-click="${keyToolbar}" style="font-size: 18px" title="${mainPageTitle} ${t("plugin")}">${toolbarIcon}</a>
    </div>
    `,
  })

  // ページバーにボタンを追加
  logseq.App.registerUIItem('pagebar', {
    key: keyPageBarId,
    template: `
      <div id="${keyPageBarId}" title="${mainPageTitle} ${t("plugin")}">
      <button id="${keyToggleButton}" data-on-click="${keyToggleButton}" title="${t("Change Style")}">🎨</button>
      <button id="${keySettingsButton}" data-on-click="${keySettingsButton}" title="${t("Plugin Settings")}">⚙</button>
      <button id="${keyRunButton}" data-on-click="${keyRunButton}" title="${t("Update page list.")}">◆ ${t("Pages")}</button>
      <button id="${keyAssetsButton}" data-on-click="${keyAssetsButton}" title="${t("Randomly search for assets.")}">◇ ${t("Assets")}</button>
      <button id="${keyCloseButton}" data-on-click="${keyCloseButton}" title="${t("Press this button when finished.")}">✖ ${t("Close")}</button>
      </div>
      <style>
      #${keyPageBarId} {
        display: none;
      }
      ${logseqVersionMd === true ? `
      div.page:has([id="${t(mainPageTitleLower)}"]) #${keyPageBarId} {
        display: block
      }
      `: `
      body:is([data-page="${t(mainPageTitle)}"], [data-page="${t(mainPageTitleLower)}"]) #${keyPageBarId} {
        display: block
      }
  `}
      </style>
      `,
  })


  // 300ms待機
  await new Promise((resolve) => setTimeout(resolve, 300))

  // メニューバーのヘッダーに追加
  if (logseq.settings!.addLeftMenu === true)
    addLeftMenuNavHeader(keyLeftMenu, toolbarIcon, keyToolbar, mainPageTitle, logseqDbGraph)


  let processingButton = false
  //クリックイベント
  logseq.provideModel({

    // ツールバーボタンが押されたら
    [keyToolbar]: async () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 1000)

      await loadOrInitializePage(mainPageTitle, logseqDbGraph)
    },

    // トグルボタンが押されたら
    [keyToggleButton]: () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      // スタイルを順番に切り替える
      logseq.updateSettings({
        [keySettingsPageStyle]: styleList[(styleList.indexOf(logseq.settings![keySettingsPageStyle] as string) + 1) % styleList.length]
      })
    },

    // 設定ボタンが押されたら
    [keySettingsButton]: () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      logseq.showSettingsUI()
    },

    // 実行ボタンが押されたら
    [keyRunButton]: async () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      // ページ内容の更新をおこなう
      await updateMainContent("page", logseqVersionMd, logseqDbGraph)
    },

    // アセットボタン
    [keyAssetsButton]: async () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      // ページ内容の更新をおこなう
      await updateMainContent("assets", logseqVersionMd, logseqDbGraph)
    },

    // 閉じるボタンが押されたら
    [keyCloseButton]: () => {
      if (processingButton) return
      processingButton = true
      setTimeout(() => processingButton = false, 100)

      logseq.Editor.deletePage(mainPageTitle)
    },

  })


  logseq.App.onRouteChanged(async ({ path, template }) => handleRouteChange(path, template, logseqVersionMd))//ページ読み込み時に実行コールバック
  // logseq.App.onPageHeadActionsSlotted(async () => handleRouteChange())//Logseqのバグあり。動作保証が必要


  // CSSを追加
  logseq.provideStyle({ style: logseqVersionMd === true ? cssMain : cssMainDbModel, key: keyCssMain })


  // プラグインが有効になったとき
  // document.bodyのクラスを変更する
  if (logseq.settings![keySettingsPageStyle])
    parent.document.body.classList.add(`${shortKey}-${logseq.settings![keySettingsPageStyle]}`)


  // プラグイン設定変更時
  logseq.onSettingsChanged(async (newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {

    // スタイル変更時の処理
    if (newSet[keySettingsPageStyle] !== oldSet[keySettingsPageStyle]) {
      //document.bodyのクラスを変更する
      if (oldSet[keySettingsPageStyle])
        parent.document.body.classList.remove(`${shortKey}-${oldSet[keySettingsPageStyle]}`)
      if (newSet[keySettingsPageStyle])
        parent.document.body.classList.add(`${shortKey}-${newSet[keySettingsPageStyle]}`)
    }

    if (oldSet.addLeftMenu !== newSet.addLeftMenu) {
      if (newSet.addLeftMenu === false)
        clearEle(`${shortKey}--nav-header`)
      else
        addLeftMenuNavHeader(keyLeftMenu, toolbarIcon, keyToolbar, mainPageTitle, logseqDbGraph)
    }

  })


  // プラグインが無効になったとき
  logseq.beforeunload(async () => {
    if (logseq.settings![keySettingsPageStyle])
      parent.document.body.classList.remove(`${shortKey}-${logseq.settings![keySettingsPageStyle]}`)
    clearEle(`${shortKey}--nav-header`)
  })


  // ページメニューコンテキストに、メニューを追加
  logseq.App.registerPageMenuItem(`${toolbarIcon} ${t("Add to exclusion list of Multi-Random-Note")}`, async () => pageMenuClickAddToExclusionList())


}/* end_main */



// ページメニューコンテキストのメニューがクリックされた時の処理 (ページ名を除外リストに追加)
const pageMenuClickAddToExclusionList = async () => {
  {
    // logseq.settings!.excludesPagesは空か、複数行でページ名が記入されていて、そこに重複しなければページ名を追加する
    const currentPageEntity = await logseq.Editor.getCurrentPage() as { originalName: PageEntity["originalName"] } | null
    if (currentPageEntity) {
      const pageName = currentPageEntity.originalName
      const excludesPages = logseq.settings!.excludesPages as string
      if (excludesPages === "") {
        logseq.updateSettings({ excludesPages: pageName })
      } else
        if (excludesPages !== pageName
          && !excludesPages.split("\n").includes(pageName)) {
          logseq.updateSettings({ excludesPages: excludesPages + "\n" + pageName })
          logseq.UI.showMsg(t("Added to exclusion list of Multi-Random-Note."), "success", { timeout: 3000 })
        }
        else {
          console.warn("This page is already included.")
          logseq.UI.showMsg(t("This page is already included."), "warning", { timeout: 3000 })
        }
    }
  }
}



// ページを開いたとき
let isProcessingRootChanged = false
const handleRouteChange = async (path: string, template: string, logseqVersionMd: boolean) => {
  if (template !== "/page/:name" //ページ以外は除外
    || isProcessingRootChanged) return
  isProcessingRootChanged = true
  setTimeout(() => isProcessingRootChanged = false, 300)

  const pageName = path.replace(/^\/page\//, "")
  if (pageName === mainPageTitle) {
    await updateMainContent("page", logseqVersionMd, logseqDbGraph)
    isProcessingRootChanged = true
    setTimeout(() => isProcessingRootChanged = false, 3000)
  } else
    if (logseq.settings!.flagRemoveContent as boolean === true) {
      logseq.updateSettings({ flagRemoveContent: false })
      // 必ずHomeに移動してしまうバグがあるためdeletePage()は使えないので、ブロックのみを削除
      await deleteAllBlocks()
    }
}


const updateMainContent = async (type: "page" | "assets", logseqVersionMd: boolean, logseqDbGraph: boolean) => {
  await deleteAllBlocks()

  // 100ms待機
  await new Promise(resolve => setTimeout(resolve, 100))

  // メインページの最初のブロックを作成
  if (logseqDbGraph === true) {
    const newBlockEntity = await logseq.Editor.appendBlockInPage(mainPageTitle, "") as { uuid: BlockEntity["uuid"] } | null
    if (newBlockEntity)
      if (type === "page")
        await generateEmbed(newBlockEntity.uuid, logseqVersionMd)
      else
        if (type === "assets")
          await generateEmbedForAssets(newBlockEntity.uuid, logseqVersionMd)
  } else {
    const newBlockEntity = await logseq.Editor.appendBlockInPage(mainPageTitle, "") as { uuid: BlockEntity["uuid"] } | null
    if (newBlockEntity)
      if (type === "page")
        await generateEmbed(newBlockEntity.uuid, logseqVersionMd)
      else
        if (type === "assets")
          await generateEmbedForAssets(newBlockEntity.uuid, logseqVersionMd)
  }
  logseq.updateSettings({ flagRemoveContent: true })
}


logseq.ready(main).catch(console.error)


export const loadOrInitializePage = async (goPageName: string, logseqDbGraph: boolean) => {
  const page = await getUuidFromPageName(goPageName, logseqVersionMd) as BlockEntity["uuid"] | null
  if (page) {
    if (logseqDbGraph === true) {
      console.log(`DB Graph mode detected. Opening page: ${goPageName}`)
      // DBグラフの場合は、ページを開く
      logseq.App.replaceState('page', { name: goPageName })
    } else {
      // MDグラフの場合は、ページを開く
      logseq.App.pushState('page', { name: goPageName }) // ページを開く
    }
  } else {
    console.log(`Creating page: ${goPageName}`)
    await logseq.Editor.createPage(goPageName, { public: false }, { redirect: true, createFirstBlock: true, journal: false })
    setTimeout(() => {
      const runButton = parent.document.getElementById(keyRunButton) as HTMLElement | null
      if (runButton)
        runButton.click()
    }, 300)
  }
  logseq.UI.showMsg(`${goPageName}`, "info", { timeout: 2200 })
}


// MDモデルかどうかのチェック DBモデルはfalse
const checkLogseqVersion = async (): Promise<boolean> => {
  const logseqInfo = (await logseq.App.getInfo("version")) as AppInfo | any
  //  0.11.0もしくは0.11.0-alpha+nightly.20250427のような形式なので、先頭の3つの数値(1桁、2桁、2桁)を正規表現で取得する
  const version = logseqInfo.match(/(\d+)\.(\d+)\.(\d+)/)
  if (version) {
    logseqVersion = version[0] //バージョンを取得
    // console.log("logseq version: ", logseqVersion)

    // もし バージョンが0.10.*系やそれ以下ならば、logseqVersionMdをtrueにする
    if (logseqVersion.match(/0\.([0-9]|10)\.\d+/)) {
      logseqVersionMd = true
      // console.log("logseq version is 0.10.* or lower")
      return true
    } else logseqVersionMd = false
  } else logseqVersion = "0.0.0"
  return false
}


// DBグラフかどうかのチェック
const checkLogseqDbGraph = async (): Promise<boolean> => await (logseq.App as any).checkCurrentIsDbGraph() as boolean | false || false

const deleteAllBlocks = async () => {
  const blocks = await logseq.Editor.getPageBlocksTree(mainPageTitle) as { uuid: BlockEntity["uuid"] }[]
  if (blocks)
    // 全てのブロックを削除
    for (const block of blocks)
      await logseq.Editor.removeBlock(block.uuid)
}
