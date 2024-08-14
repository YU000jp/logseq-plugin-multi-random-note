import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { mainPageTitle } from ".."


export interface pageEntityShort {
  name: PageEntity["name"]
  uuid: PageEntity["uuid"]
  originalName: PageEntity["originalName"]
}
[]


export const isPageExcluded = (pageName: string) => {
  if (logseq.settings!.excludesPages as string !== ""
    && ((logseq.settings!.excludesPages as string) === pageName
      || (logseq.settings!.excludesPages as string).split("\n").some((v: string) => v === pageName)))
    return true

  else if (logseq.settings!.excludesPagesStartWith as string !== ""
    && ((logseq.settings!.excludesPagesStartWith as string) === pageName
      || ((logseq.settings!.excludesPagesStartWith as string).includes("\n")
        && (logseq.settings!.excludesPagesStartWith as string).split("\n").some((v: string) => pageName.startsWith(v)))))
    return true

  else if (logseq.settings!.excludesPagesContain as string !== ""
    && ((logseq.settings!.excludesPagesContain as string) === pageName
      || ((logseq.settings!.excludesPagesContain as string).includes("\n")
        && (logseq.settings!.excludesPagesContain as string).split("\n").some((v: string) => pageName.includes(v)))))
    return true

  else if (logseq.settings!.excludesPagesRegex as string !== ""
    && ((logseq.settings!.excludesPagesRegex as string) === pageName
      || ((logseq.settings!.excludesPagesRegex as string).includes("\n")
        && (logseq.settings!.excludesPagesRegex as string).split("\n").some((v: string) => new RegExp(v).test(pageName)))))
    return true

  else
    return false
}


export const addLeftMenuNavHeader = (divId: string, icon: string, title: string, goPageName: string) => {
  try {
    clearEle(divId)
  } finally {
    const leftSidebarElement = parent.document.querySelector("#left-sidebar div.nav-header") as HTMLElement | null
    if (leftSidebarElement) {
      const div = document.createElement("div")
      div.id = divId
      leftSidebarElement.appendChild(div)

      const anchor = document.createElement("a")
      anchor.className = "item group flex items-center text-sm font-medium rounded-md"
      anchor.addEventListener("click", () => logseq.App.pushState('page', { name: goPageName }) // ページを開く
      )
      div.appendChild(anchor)

      const spanIcon = document.createElement("span")
      spanIcon.className = "ui__icon ti ls-icon-files"
      spanIcon.textContent = icon
      anchor.appendChild(spanIcon)

      const span = document.createElement("span")
      span.className = ("flex-1")
      span.textContent = title
      anchor.appendChild(span)
    }
  }
}


export const clearEle = (elementById: string): boolean => {
  const ele = parent.document.getElementById(elementById) as HTMLElement | null
  if (ele) {
    ele.remove()
    return true
  } else
    return false
}

