import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user"

const advancedQuery = async <T>(query: string, ...input: Array<any>): Promise<T | null> => {
  try {
    const result = await logseq.DB.datascriptQuery(query, ...input)
    return result?.flat() as T ?? null
  } catch (err) {
    console.warn("Query execution failed:", err)
    return null
  }
}

export const getUuidFromPageName = async (pageName: string, logseqVerMd: boolean): Promise<BlockEntity["uuid"] | null> => {
  const result = await advancedQuery<BlockEntity["uuid"]>(`
    [:find
      (pull ?b [:block/uuid])
    :where
      [?p :block/${logseqVerMd === true ? "name" : "title"} "${pageName}"]
      [?b :block/page ?p]]`)
  return result as BlockEntity["uuid"] | null
}
