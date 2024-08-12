import '@logseq/libs' //https://plugins-doc.logseq.com/
import { LSPluginBaseInfo, PageEntity } from '@logseq/libs/dist/LSPlugin.user'
import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { handleMainPage } from './handlePage'
import cssMain from './main.css?inline'
import { settingsTemplate } from './settings'
import ja from "./translations/ja.json"


export const pageTitle = "Multi Random Note" // メインページのタイトル
export const pageTitleLower = pageTitle.toLowerCase()
export const shortKey = "mrn"
const keyCssMain = "main"
const keyToolbar = "Multi-Random-Note"
const toolbarIcon = "☢️"
export const keySettingsPageStyle = "pageStyle"

let processing = false // 処理中フラグ


/* main */
const main = async () => {

  await l10nSetup({ builtinTranslations: { ja } })

  /* user settings */
  logseq.useSettingsSchema(settingsTemplate())
  if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300)

  // ツールバーにボタンを追加
  logseq.App.registerUIItem('toolbar', {
    key: keyToolbar,
    template: `
    <div>
      <a class="button icon" data-on-click="${keyToolbar}" style="font-size: 16px" title="${pageTitle} ${t("plugin")}">${toolbarIcon}</a>
    </div>
    `,
  })

  //クリックイベント
  logseq.provideModel({
    [keyToolbar]: () => handleMainPage(t(pageTitle)),
  })

  //戻るボタン対策
  logseq.App.onRouteChanged(async () => handleRouteChange())//ページ読み込み時に実行コールバック
  logseq.App.onPageHeadActionsSlotted(async () => handleRouteChange())//Logseqのバグあり。動作保証が必要

  // CSSを追加
  logseq.provideStyle({ style: cssMain, key: keyCssMain })

  // プラグインが有効になったとき
  // document.bodyのクラスを変更する
  if (logseq.settings![keySettingsPageStyle])
    parent.document.body.classList.add(`${shortKey}-${logseq.settings![keySettingsPageStyle]}`)

  // プラグイン設定変更時
  logseq.onSettingsChanged(async (newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {

    // const currentPageEntity = await logseq.Editor.getCurrentPage() as { originalName: PageEntity["originalName"] } | null
    // if (currentPageEntity
    //   && currentPageEntity.originalName === t(pageTitle))
    //   await handleMainPage(t(pageTitle)) // メインページを開いていた場合のみ、再描画

    // スタイル変更時の処理
    if (newSet[keySettingsPageStyle] !== oldSet[keySettingsPageStyle]) {
      //document.bodyのクラスを変更する
      if (oldSet[keySettingsPageStyle])
        parent.document.body.classList.remove(`${shortKey}-${oldSet[keySettingsPageStyle]}`)
      if (newSet[keySettingsPageStyle])
        parent.document.body.classList.add(`${shortKey}-${newSet[keySettingsPageStyle]}`)
    }
  })


  // プラグインが無効になったとき
  logseq.beforeunload(async () => {

    // document.bodyのクラスを変更する
    if (logseq.settings![keySettingsPageStyle])
      parent.document.body.classList.remove(`${shortKey}-${logseq.settings![keySettingsPageStyle]}`)
    // #${shortKey}-changeStyleを削除
    const ele = parent.document.getElementById(`${shortKey}-changeStyle`)
    if (ele)
      ele.remove()
  })

}/* end_main */


logseq.ready(main).catch(console.error)



export const checkProcessing = (): boolean => {
  if (processing) {
    console.warn("processing")
    return true
  }
  processing = true
  setTimeout(() => processing = false, 300)
  return false
}


//戻るボタン対策
let isProcessingRootChanged = false
const handleRouteChange = () => {
  if (isProcessingRootChanged) return
  isProcessingRootChanged = true
  setTimeout(() => isProcessingRootChanged = false, 300)

  //#${shortKey}-changeStyleが存在する場合は実行しない
  if (parent.document.getElementById(`${shortKey}-changeStyle`)) return

  setTimeout(async () => {
    if (checkProcessing()) return
    const currentPageEntity = await logseq.Editor.getCurrentPage() as { originalName: PageEntity["originalName"] } | null
    if (currentPageEntity)
      if (currentPageEntity.originalName === t(pageTitle))
        await handleMainPage(t(pageTitle)) // メインページを開いていた場合のみ 戻るボタン対策
  }, 100)
}