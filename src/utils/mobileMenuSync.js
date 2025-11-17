/**
 * Mobile Menu Sync - Ensures only one hamburger menu is open at a time
 */

let headerMenuCallback = null;
let sidebarMenuCallback = null;

export const registerHeaderMenu = (closeCallback) => {
  headerMenuCallback = closeCallback;
};

export const registerSidebarMenu = (closeCallback) => {
  sidebarMenuCallback = closeCallback;
};

export const closeHeaderMenu = () => {
  if (headerMenuCallback) headerMenuCallback();
};

export const closeSidebarMenu = () => {
  if (sidebarMenuCallback) sidebarMenuCallback();
};

export const openHeaderMenu = () => {
  closeSidebarMenu();
};

export const openSidebarMenu = () => {
  closeHeaderMenu();
};

