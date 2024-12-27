# Logseq Plugin: Multi Random Note 🎯

- Lists randomly selected pages or assets
  > This plugin is based on [Random Note plugin](https://github.com/tankcool/logseq-random-note) produced by [@TankCool](https://github.com/tankcool/).

> [!WARNING]
This plugin does not work with Logseq db version.

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-multi-random-note/)/[日本語](https://github.com/YU000jp/logseq-plugin-multi-random-note/blob/main/readme.ja.md) [![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-multi-random-note)](https://github.com/YU000jp/logseq-plugin-multi-random-note/releases)[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-multi-random-note/total.svg)](https://github.com/YU000jp/logseq-plugin-multi-random-note/releases)<!-- Published 2023 --><a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
</div>

## Feature

- It can be customized in several sizes and styles to display multiple page content.
  > ![Randomプラグイン](https://github.com/user-attachments/assets/ea0de8b8-4b77-490e-8b80-56442192ec8f)

---

## Getting Started

### Install from Logseq Marketplace

- Press [`---`] on the top right toolbar to open [`Plugins`]. Select marketplace. Type `Multi` in the search field, select it from the search results and install

  ![image](https://github.com/user-attachments/assets/56b723b2-7c51-4b13-87b7-51c652df734e)

### Usage

- A new header item is added to the left menu of Logseq. Click on it to access a dedicated plugin page.
  > ![image](https://github.com/user-attachments/assets/5e263800-73ee-4527-a4c2-8851e0d07e27)

- On the page, there is a menu in the top right-hand corner: press Pages or Assets and a new random extraction will be made for each. Press the 🎨 button to switch between display styles.
  > It is possible to change the number of pages displayed and set pages to be excluded in the plugin settings.

---

## Showcase / Questions / Ideas / Help

> Go to the [Discussions](https://github.com/YU000jp/logseq-plugin-multi-random-note/discussions) tab to ask and find this kind of things.
- Note:
  1. After switching styles, the columns are retained.
  1. In Wide style, except in edit mode, scrolling occurs horizontally with vertical scrolling.
  1. If pages with a large amount of content are included, overheads are incurred and the display is slower. Reduce the number of displays or exclude pages.
  1. In Assets view, files that are not currently used for processing reasons are also made explicit.
  1. To reduce overheads, Linked References does not work. (The db version of Logseq might be possible.)
  1. As with normal embed, it can be edited on the fly. If the display area is too small, open it in the sidebar or zoom in.
  1. Instead of the left menu, it can also be accessed via a toolbar button.
1. This plugin still has room for improvement. Please let me know if you encounter any issues or have any ideas for enhancement.
1. This plugin relies on Logseq's DOM (Document Object Model) structure. If the DOM structure changes due to a Logseq version update, styles may not be applied. We will adjust the CSS to deal with it. If you notice something, please raise an issue.

## Prior art & Credit

Logseq Plugin > [@TankCool/ Random Note](https://github.com/tankcool/logseq-random-note)

Icon > [icooon-mono.com](https://icooon-mono.com/00108-%e3%83%80%e3%83%bc%e3%83%84%e3%81%ae%e7%9f%a2%e3%81%ae%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b3%e7%b4%a0%e6%9d%90/)

Author > [@YU000jp](https://github.com/YU000jp)
