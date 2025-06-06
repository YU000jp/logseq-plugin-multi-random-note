import { BlockEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { pageEntityShort } from "./lib"


export const getPageEntities = async (query: string, logseqVersionMd: boolean): Promise<pageEntityShort | null> => {
  try {
    const pageEntities = (await logseq.DB.datascriptQuery(query) as any)?.flat()
    for (let i = 0; i < pageEntities.length; i++) {
      const block = pageEntities[i] as { page: BlockEntity["page"] }
      if (block["pre-block?"])
        pageEntities[i] = await logseq.Editor.getPage(block.page.id) as pageEntityShort[] | null
    }
    return pageEntities

  } catch (err: any) {
    logseq.UI.showMsg(err.message || t("Maybe something wrong with the query"), "warning", { timeout: 2200 })
    console.warn(err)
  }
  return null
}


export const getQueryScript = (logseqVersionMd: boolean): string => {
  const defaultQuery = `
      [:find (pull ?p [:block/name :block/uuid])
        :where
        [_ :block/page ?p]]`
  switch (logseq.settings!.randomMode as string) {
    case "page":
      if (logseq.settings!.includeJournals as boolean || logseqVersionMd === false) {
        return `
            [:find (pull ?p [:block/name :block/uuid])
              :where
              [_ :block/page ?p]]`
      } else {
        return `
            [:find (pull ?p [:block/name :block/uuid])
              :where
              [_ :block/page ?p]
              [?p :block/journal? false]]`
      }
    case "tags":
      const tags = (logseq.settings!.randomTags as string).split(",")
        .map((item) => '"' + item.toLowerCase() + '"')
        .join(",")
      if (logseq.settings!.randomTags === "")
        logseq.UI.showMsg("Random tags are required.", "warning")
      return (
        `
          [:find (pull ?b [:block/name :block/uuid])
            :where
            [?b :block/refs ?bp]
            [?bp :block/name ?name]
            [(contains? #{` +
        tags +
        `} ?name)]]
          `
      )
    case "card":
      return `
            [:find (pull ?b [:block/name :block/uuid])
              :where
              [?b :block/refs ?bp]
              [?bp :block/name ?name]
              [(contains? #{"card"} ?name)]]
            `
    case "query":
      if (logseq.settings!.advancedQuery === "")
        logseq.UI.showMsg(t("Set up the query on the plugin settings."))
      return logseq.settings!.advancedQuery as string
    default:
      console.warn("unknown random mode")
      return defaultQuery
  }
}