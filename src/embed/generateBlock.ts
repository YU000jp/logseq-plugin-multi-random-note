import { IBatchBlock } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { keySettingsPageStyle } from "../settings"
import { isPageExcluded, pageEntityShort } from "./lib"
import { getPageEntities, getQueryScript } from "./random"


let beforeArray: string[] = []
export const generateEmbed = async (firstBlockUuid: string) => {

  const pageEntities = await getPageEntities(getQueryScript()) as pageEntityShort[] | null
  if (pageEntities) {
    const batch: IBatchBlock[] = []
    // // 重複を取り除く
    pageEntities.filter((element, index, self) =>
      index === self.findIndex((e) => (
        e["uuid"]
        && e["uuid"] === element["uuid"] // uuidが一致するものを取り除く
        && isPageExcluded(e.originalName) === false // 除外リスト
      )))

    for (const pageEntity of (((pageEntities.filter((page) =>
      beforeArray.includes(page.name) === false // 前回との重複を防ぐ
    ))
      .sort(() => 0.5 - Math.random()))// Shuffle the filtered pages
      .slice(0, (Number(// Take the first `count` elements from the shuffled array
        logseq.settings![keySettingsPageStyle] === "Tile"
          ? logseq.settings!.randomStepCountTileOnly as string || 12
          : logseq.settings!.randomStepCount as string || 6
      ))))) {

      const word = pageEntity.name
      if (word) {
        // Insert block for each selected asset
        batch.push({
          content: `{{embed [[${word}]]}}`, // embedを使用
        }) // 処理過負荷防止のためembedのみ使用
        beforeArray.push(word)
      }
    }

    await logseq.Editor.insertBatchBlock(firstBlockUuid, batch, { before: false, sibling: false, })

    // 先頭行
    await logseq.Editor.updateBlock(firstBlockUuid, t("Page list"))

  } else {
    logseq.UI.showMsg(t("Maybe something wrong with the query"), "warning", { timeout: 2200 })
    console.warn("Failed query")
  }
  // ブロックの編集モードを終了
  await logseq.Editor.exitEditingMode()
}



let beforeArrayAssets: string[] = []

export const generateEmbedForAssets = async (firstBlockUuid: string) => {


  const assets = await logseq.Assets.listFilesOfCurrentGraph() as {
    path: string
    size: number
    // accessTime: number;
    // modifiedTime: number;
    // changeTime: number;
    // birthTime: number;
  }[]
  if (assets) {
    const batch: IBatchBlock[] = []
    for (const asset of (((assets.filter(
      (asset) =>
        asset.path !== ""
        && asset.size > 0
        && beforeArrayAssets.includes((asset.path)) === false // 前回との重複を防ぐ
      // Filter assets that have a non-empty path and size greater than 0
    ))
      .sort(() => 0.5 - Math.random()))// Shuffle the filtered assets
      .slice(0, (Number(// Take the first `count` elements from the shuffled array
        logseq.settings![keySettingsPageStyle] === "Tile"
          ? logseq.settings!.randomStepCountTileOnly as string || 12
          : logseq.settings!.randomStepCount as string || 6
      ))))) {

      const word = asset.path.split("\\").pop() // パスを除いたファイル名
      if (word) {
        // Insert block for each selected asset
        batch.push({
          content: `{{query "${word}"}}`, // クエリーキーワード
        })
        beforeArrayAssets.push(asset.path) // パスで記録
      }
    }

    await logseq.Editor.insertBatchBlock(firstBlockUuid, batch, { before: false, sibling: false, })

    // Update the first block
    await logseq.Editor.updateBlock(firstBlockUuid, t("Assets list"))

  } else {
    logseq.UI.showMsg(t("No found"), "warning", { timeout: 2200 })
    console.warn("Failed assets random")
  }
  // ブロックの編集モードを終了
  await logseq.Editor.exitEditingMode()
}
