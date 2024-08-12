import { t } from "logseq-l10n"
import { pageTitle } from "."

export const generateEmbed = async (firstBlockUuid: string) => {
  //  {{embed [[ページ名]]}} のようにする
  await logseq.Editor.insertBlock(firstBlockUuid, `{{embed [[Logseq]]}}`, { sibling: false, focus: false, })

  // 先頭行のコンテンツに月を表示 ただし、一致する場合は片方だけ
  await logseq.Editor.updateBlock(firstBlockUuid, t(pageTitle))
  // ブロックの編集モードを終了
  await logseq.Editor.exitEditingMode()
}
