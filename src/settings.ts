import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from 'logseq-l10n'

export const styleList = [
    "Tile",
    "Gallery",
    "Wide",
    "Expansion",
]

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [
    { // メインページのスタイル
        key: keySettingsPageStyle,
        title: t("Page style"),
        type: "enum",
        enumChoices: styleList,
        default: "Tile",
        // Tile: コンテンツ最小限のスタイル
        // Gallery: 上下左右に配置するスタイル
        // Wide: 画面を横に広く使うスタイル
        // Expansion: 下側に展開するスタイル
        description: `
        
        ${t("The Tile style displays content in a minimalist manner.")}
        ${t("The Gallery style arranges the blocks up, down, left, and right.")}
        ${t("The Wide style uses the screen horizontally.")}
        ${t("The Expansion style is a style that expands on the underside.")}
        `,
    },
    {
        key: "randomMode",
        type: "enum",
        default: "page",
        title: t("Random Mode"),
        enumChoices: ["page", "card", "tags", "query"],
        enumPicker: "radio",
        description: "query: advanced query",
    },
    {
        key: "includeJournals",
        type: "boolean",
        default: false,
        title: t("Include Journals?"),
        description: "",
    },
    {
        key: "randomTags",
        type: "string",
        default: "",
        title: t("For tags mode"),
        description: `
        ${t("Comma separated the tags.")}
        ${t("e.g.")} programming,design,sports
        `,
    },
    {
        key: "advancedQuery",
        type: "string",
        default: "",
        title: t("For query mode"),
        inputAs: "textarea",
        description:
            `
          ${t("Custom query")}
          ${t("e.g.")} [:find (pull ?b [*]) :where [?b :block/refs ?bp] [?bp :block/name "book"]]
          `,
    },
    {
        key: "randomStepCount",
        type: "enum",
        default: "6",
        title: `${t("Random walk step count")} ${t("Other than Tile")}`,
        description:
            t("The number of displays must be reduced due to overheads, except for Tile."),
        enumChoices: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12"],
        enumPicker: "radio",
    },
    {
        key: "randomStepCountTileOnly",
        type: "enum",
        default: "12",
        title: `${t("Random walk step count")} ${t("'Tile' only")}`,
        description:
            t("Number of displays when opened as Tile."),
        enumChoices: ["6", "8", "10", "12", "14", "16", "18", "20"],
        enumPicker: "radio",
    },

    // Linked Referencesの埋め込みは、処理が過負荷になるのでやらない

    { // 除外するページ一覧
        key: "excludesPages",
        type: "string",
        default: "",
        // 除外ページのその名前
        title: t("List of pages to exclude"),
        inputAs: "textarea",
        // ページ名を入力
        // 複数指定する場合は、改行区切りで記述してください。
        // ページメニューから、除外リストに追加可能です。
        description: `
        ${t("Enter page names.")}
        ${t("Multiple specifications can be made by line breaks.")}
        ${t("It can be added to the exclusion list via the page menu.")}
      `
    },
    {// 除外するページ名の特徴 (先頭にマッチする場合)
        key: "excludesPagesStartWith",
        type: "string",
        default: "",
        title: "↘️" + t("Start With"),
        inputAs: "textarea",
        description: `${t("Match if it starts with a specific string (e.g. hierarchy[AAA/]).")}`,
    },
    {// 特定の文字列を含む場合にマッチします。ほかの指定方法よりも強力ですので注意してください。
        key: "excludesPagesContain",
        type: "string",
        default: "",
        title: "↘️" + t("Contain"),
        inputAs: "textarea",
        description: `
            ${t("Match if it contains a specific string.")}
            ⚠️${t("Be careful as it is more powerful than other specifications.")}`,
    },
    {// 正規表現にマッチする場合
        key: "excludesPagesRegex",
        type: "string",
        default: "",
        title: "↘️" + t("Regular Expression"),
        inputAs: "textarea",
        description: "",
    },

    {
        key: "addLeftMenu",
        type: "boolean",
        default: true,
        title: t("Add a button to the left menu bar to access this plugin"),
        description: t("Or from the toolbar"),
    },
]

export const keySettingsPageStyle = "pageStyle"
