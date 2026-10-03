import '@logseq/libs' //https://plugins-doc.logseq.com/
import { BlockEntity, LSPluginBaseInfo, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
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
let logseqVersion: string = "" //バージョン情報用
let logseqVersionMd: boolean = false //現在のグラフがファイルベースかどうか(!DBグラフ)
let logseqDbGraph: boolean = false //現在のグラフがDBグラフかどうか
let logseqDbEraApp: boolean = false //DB系世代(新UI)アプリかどうか。グラフ種別とは別物


/* main */
const main = async () => {

  // アプリ情報チェック(バージョン解析のみ。グラフ種別の判定には使わない)
  const appInfo = await fetchAppInfo()
  logseqVersion = appInfo.version
  logseqDbEraApp = appInfo.isDbEra

  // グラフ種別チェック(公式API。DBグラフならtrue)
  logseqDbGraph = await checkLogseqDbGraph()
  logseqVersionMd = !logseqDbGraph
  console.log(`${logseqDbGraph ? "DB Graph" : "MD Graph"} mode detected. (Logseq ${logseqVersion})`)

  // グラフ切替時にフラグを更新
  logseq.App.onCurrentGraphChanged(async () => {
    logseqDbGraph = await checkLogseqDbGraph()
    logseqVersionMd = !logseqDbGraph
  })

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
      ${logseqDbEraApp === false ? `
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
  logseq.provideStyle({ style: logseqDbEraApp === false ? cssMain : cssMainDbModel, key: keyCssMain })


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
    const currentPageEntity = await logseq.Editor.getCurrentPage() as { originalName?: PageEntity["originalName"], title?: string } | null
    if (currentPageEntity) {
      const pageName = currentPageEntity.originalName! || currentPageEntity.title!
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
    // DB model & DB graph
    // TODO: block操作がエラーになる 「 Uncaught (in promise) RangeError: Maximum call stack size exceeded 」 「 RangeError: Maximum call stack size exceeded 」
    // const newBlockEntity = await logseq.Editor.insertBlock(mainPageTitle, "") as { uuid: BlockEntity["uuid"] } | null
    // // 100ms待機
    // await new Promise(resolve => setTimeout(resolve, 100))
    // if (newBlockEntity)
    //   if (type === "page")
    //     await generateEmbed(newBlockEntity.uuid, logseqVersionMd)
    //   else
    //     if (type === "assets")
    //       await generateEmbedForAssets(newBlockEntity.uuid, logseqVersionMd)
    logseq.UI.showMsg("DB graph is not supported yet ('Multi Random Note' plugin)", "warning", { timeout: 3000 })
  } else {
    // file-based model
    // DB model & file-based graph
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
      // console.log(`DB Graph mode detected. Opening page: ${goPageName}`)
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


// アプリのバージョンと世代を取得(バージョン解析のみ。グラフ種別の判定には使わない)
const fetchAppInfo = async (): Promise<{ version: string; isDbEra: boolean }> => {
  const raw = await logseq.App.getInfo("version")
  const version = typeof raw === "string" ? raw : "0.0.0"
  //  0.11.0もしくは0.11.0-alpha+nightly.20250427のような形式なので、先頭の3つの数値(1桁、2桁、2桁)を正規表現で取得する
  const m = version.match(/(\d+)\.(\d+)\.(\d+)/)
  // 0.11.x以降と2.x以降がDB系世代(新UI)。1.x(OG)は旧UI系統
  const isDbEra = m ? (Number(m[1]) >= 2 || (Number(m[1]) === 0 && Number(m[2]) >= 11)) : false
  return { version: m ? m[0] : version, isDbEra }
}


// DBグラフかどうかのチェック DBグラフだけtrue
// 公式APIを使用。0.10.x以前のホストには未実装でrejectする → false
const checkLogseqDbGraph = async (): Promise<boolean> => {
  try {
    const value = await logseq.App.checkCurrentIsDbGraph()
    return typeof value === "boolean" ? value : false
  } catch {
    return false // API非搭載ホスト = DBグラフを開けない旧アプリ
  }
}

const deleteAllBlocks = async () => {
  const blocks = await logseq.Editor.getPageBlocksTree(mainPageTitle) as { uuid: BlockEntity["uuid"] }[]
  if (blocks)
    // 全てのブロックを削除
    for (const block of blocks)
      await logseq.Editor.removeBlock(block.uuid)
}
