// Set to true to show the complete research page; false shows only the opening screen.
window.GNR_SITE = Object.freeze({ fullSite: false });
document.documentElement.dataset.siteMode = window.GNR_SITE.fullSite ? 'full' : 'preview';
