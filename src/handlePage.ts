import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { checkProcessing, keySettingsPageStyle, pageTitleLower, shortKey } from "."
import { generateEmbed } from "./generateEmbed"
import { styleList } from "./settings"

export const handleMainPage = async (pageName: string) => {


  if (checkProcessing() // 処理中の場合は何もしない
    || parent.document.getElementById(`${shortKey}-changeStyle`)) // #${shortKey}-changeStyleが存在する場合は実行しない
    return

  const { firstBlockUuid, mainPageUuid }: { firstBlockUuid: string | null; mainPageUuid: string | null } = await createOrUpdateMainPage(pageName)

  if (!firstBlockUuid
    || !mainPageUuid)
    return
  else {
    await generateEmbed(firstBlockUuid) //変化があった場合のみ、埋め込みジャーナルを作成

    // メインページに移動
    await new Promise(resolve => {
      setTimeout(() => {
        // メインページに移動 (uuidを指定すると、ブロックとして開く)
        logseq.App.pushState("page", { name: mainPageUuid })
        resolve("done")
      }, 0)
    })

    await new Promise(resolve => {
      setTimeout(() => {

        // メインページのブレッドクラム要素を取得 (uuidブロックとして開いたときのみ動作させる)
        const breadcrumbElement = parent.document.body.querySelector("div#root>div>main div#main-content-container div.page div.breadcrumb") as HTMLElement | null
        if (breadcrumbElement) {

          // メインページのボタンを追加
          changeStyleButton(breadcrumbElement) // スタイル変更ボタンとプラグイン設定を開くボタン

          // スクロールを縦ではなく横にする (ホイールイベント)
          handleScrolling() // Note: 一部スタイルのみで動作させるが、イベントリスナー内で判定している

        }// else
        //   console.warn("breadcrumbElement is null")

        resolve("done")
      }, 100)
    })
  }
}


const changeStyleButton = (element: HTMLElement) => {
  let newElement: HTMLButtonElement | null = parent.document.getElementById(`${shortKey}-changeStyle`) as HTMLButtonElement | null // すでにボタンが存在するかどうか
  if (!newElement) {
    //存在しなければ、ボタンを作成
    newElement = document.createElement("button") // ボタンを作成
    newElement.textContent = "●" // マーク
    newElement.id = `${shortKey}-changeStyle` // idを設定 (beforeunloadで削除する。CSSでスタイルを設定するため)
    newElement.title = t("Change Style") // ツールチップ
    newElement.style.marginLeft = "10px" // マージンを設定
    newElement.style.color = "var(--lx-accent-11,var(--ls-link-text-color,hsl(var(--primary)/.8)))" // 通常リンクの色と同等
    element.appendChild(newElement) // ボタンを追加
  }
  // クリックイベント
  newElement.addEventListener("click", (ev: MouseEvent) => {
    ev.preventDefault()
    // スタイルを順番に切り替える
    logseq.updateSettings({
      [keySettingsPageStyle]: styleList[(styleList.indexOf(logseq.settings![keySettingsPageStyle] as string) + 1) % styleList.length]
    })
  })

  // プラグイン設定を開くボタン
  let newElementSetting: HTMLButtonElement | null = parent.document.getElementById(`${shortKey}-openSetting`) as HTMLButtonElement | null // すでにボタンが存在するかどうか
  if (!newElementSetting) {
    //存在しなければ、ボタンを作成
    newElementSetting = document.createElement("button") // ボタンを作成
    newElementSetting.textContent = "⚙" // マーク
    newElementSetting.id = `${shortKey}-openSetting` // idを設定 (beforeunloadで削除する。CSSでスタイルを設定するため)
    newElementSetting.title = t("Open Plugin Setting") // ツールチップ
    newElementSetting.style.marginLeft = "10px" // マージンを設定
    newElementSetting.style.color = "var(--lx-accent-11,var(--ls-link-text-color,hsl(var(--primary)/.8)))" // 通常リンクの色と同等
    element.appendChild(newElementSetting) // ボタンを追加
  }
  // クリックイベント
  newElementSetting.addEventListener("click", (ev: MouseEvent) => {
    ev.preventDefault()
    logseq.showSettingsUI()
  })
}


const handleScrolling = () => {
  const scrollTargetElement = parent.document.getElementById("main-content-container") as HTMLElement | null // スクロール対象の要素
  if (scrollTargetElement)
    scrollTargetElement.addEventListener("wheel", (ev: WheelEvent) => eventListener(scrollTargetElement, ev), { passive: false }) // ホイールイベント
  // else
  //   console.warn("mainContentContainerElement is null")
}


let processingEventListener = false
const eventListener = (scrollTargetElement: HTMLElement, ev: WheelEvent) => {
  if (processingEventListener)
    return
  processingEventListener = true

  // "body.${shortKey}-Wide"というクラスがある場合のみ処理
  if (parent.document.body.classList.contains(`${shortKey}-Wide`)
    && parent.document.getElementById(pageTitleLower) as Node) {

    //console.log("activeElement", parent.document.activeElement?.classList)
    if (parent.document.activeElement?.classList.contains("normal-block")) // ブロックを編集中の場合は横スクロールをしない
    { }
    else
      if (Math.abs(ev.deltaY) < Math.abs(ev.deltaX)) // 縦より横のスクロールの方が大きい場合
      { }
      else
        if ((scrollTargetElement.scrollLeft <= 0 && ev.deltaY < 0) || (scrollTargetElement.scrollLeft >= (scrollTargetElement.scrollWidth - scrollTargetElement.clientWidth) && ev.deltaY > 0)) // スクロールが端に達した場合
          ev.preventDefault()
        else {
          ev.preventDefault()
          scrollTargetElement.scrollLeft += ev.deltaY // 横スクロール実行
        }
    //遅延処理
    setTimeout(() => processingEventListener = false, 10) // 10ms後に処理を再開

  } else {
    // イベントリスナー削除
    scrollTargetElement.removeEventListener("wheel", (ev) => eventListener(scrollTargetElement, ev))
    setTimeout(() => processingEventListener = false, 1000) // 1秒後に処理を再開
  }
}


// メインページを作成または更新する
const createOrUpdateMainPage = async (pageName: string): Promise<{ firstBlockUuid: string | null; mainPageUuid: string | null }> => {

  // メインページの最初のブロックのuuid
  let firstBlockUuid: BlockEntity["uuid"] | null = null
  // メインページのuuid
  let mainPageUuid: PageEntity["uuid"] | null = null

  // メインページが存在するかどうか
  const mainPage = await logseq.Editor.getPage(pageName) as { uuid: PageEntity["uuid"] } | null
  if (mainPage) {
    mainPageUuid = mainPage.uuid

    // ページのブロックツリーを取得
    const blocks = await logseq.Editor.getPageBlocksTree(mainPage.uuid) as { uuid: PageEntity["uuid"] }[]
    if (blocks) {
      // 全てのブロックを削除
      for (const block of blocks)
        await logseq.Editor.removeBlock(block.uuid)
      // メインページの最初のブロックを作成
      const newBlockEntity = await logseq.Editor.appendBlockInPage(mainPage.uuid, "") as { uuid: BlockEntity["uuid"] } | null
      if (newBlockEntity)
        firstBlockUuid = newBlockEntity.uuid // メインページの最初のブロックのuuidを取得
      // else
      //   console.warn("newBlockEntity is null")
    }
    // else
    //   console.warn("blocks is null")

  } else {

    // メインページが存在しない場合、新規作成
    const newPage = await logseq.Editor.createPage(pageName, {}, { redirect: false, createFirstBlock: false, }) as { uuid: PageEntity["uuid"] }
    if (newPage) {
      mainPageUuid = newPage.uuid

      // メインページの最初のブロックを作成
      const newBlockEntity = await logseq.Editor.appendBlockInPage(newPage.uuid, "") as { uuid: BlockEntity["uuid"] } | null // メインページの最初のブロックを作成
      if (newBlockEntity)
        firstBlockUuid = newBlockEntity.uuid // メインページの最初のブロックのuuidを取得
      // else
      //   console.warn("newBlockEntity is null")
    }
    // else
    //   console.warn("newPage is null")
    // createPageリダイレクトフラグつき。(メインページに移動)
  }

  return { firstBlockUuid, mainPageUuid }
}
