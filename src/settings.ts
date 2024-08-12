import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from 'logseq-l10n'
import { keySettingsPageStyle } from '.'

export const styleList = [
    "Normal",
    "Wide",
    //"Tile",
    "Gallery",
    // "List"
]

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [
    { // メインページのスタイル
        key: keySettingsPageStyle,
        title: t("Page style"),
        type: "enum",
        enumChoices: styleList,
        default: "Normal",
        // Normal: 通常スタイル
        // Wide: 画面を横に広く使うスタイル
        // Gallery: 上下左右に配置するスタイル
        description: `
        ${t("The Normal style is the default style.")}
        ${t("The Wide style uses the screen horizontally.")}
        ${t("The Gallery style arranges the blocks up, down, left, and right.")}
        `,
    }
]
