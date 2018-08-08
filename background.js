
// Main BG class
class Extension {

    // Add sites to storage
    addSites(tabs) {
        return new Promise((resolve) => {
            chrome.storage.sync.get("sites", (storage) => {
                let sites = storage["sites"] || [];
    
                for (let tab of tabs) {
                    // Get a favicon properly
                    if (!tab.favIconUrl || tab.favIconUrl.indexOf("chrome://theme") > -1) {
                        tab.favIconUrl = chrome.runtime.getURL("../img/favicon.png");
                    }
    
                    let site = { title: tab.title, faviconUrl: tab.favIconUrl, url: tab.url };
                    sites.push(site);
                }
    
                // Save modified |storage| object
                chrome.storage.sync.set({sites}, () => {
                    resolve();
                });
            });
        });
    }

    // Open all saved sites
    openAllSites() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(null, (storage) => {
                let sites = storage["sites"] || [];

                if (sites.length === 0) {
                    reject("No sites to open!");
                    return;
                }

                if (sites.length > 8) {
                    let confirm = window.confirm("Would you like to open " + sites.length + " notes?");
                    if (!confirm) {
                        reject("User does not want to open sites.");
                        return;
                    }
                }

                // Open all notes in a new window
                let urls = [];
                for (let site of sites) {
                    urls.push(site.url);
                }
                
                chrome.windows.create({ url: urls }, () => {
                    resolve();
                });
            });
        });
    }

    // Remove site from storage
    removeSite(url) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get("sites", (storage) => {
                let sites = storage["sites"];

                if (!sites) {
                    reject("No sites have been found!");
                    return;
                }

                // Remove URL chosen to be removed
                for (let i = 0; i<sites.length; i++) {
                    if (sites[i].url === url) {
                        sites.splice(i, 1);
                        break;
                    }
                }

                chrome.storage.sync.set({sites}, () => {
                    resolve();
                });
            });
        });
    }

    // Get some info about current tab
    getCurrentTabInfo() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true }, (tabs) => {
                resolve(tabs);
            });
        });
    }

    listenForMessages() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "getCurrentTabInfo") {
                this.getCurrentTabInfo().then((tab) => {
                    console.log("TAB INFO: ", tab);
                    sendResponse(tab);
                })
            } else if (message.action === "addSites") {
                this.addSites(message.notes).then(() => {
                    console.log("Sites have been successfully stored!");
                    sendResponse(true);
                })
            } else if (message.action === "openAllSites") {
                this.openAllSites().then(() => {
                    console.log("All sites have been successfully opened.");
                    sendResponse(true);
                }).catch((message) => {
                    console.log(message);
                    sendResponse(false);
                });
            } else if (message.action === "removeSite") {
                this.removeSite(message.url).then(() => {
                    console.log(`Site ${message.url} has been successfully removed!`);
                    sendResponse(true);
                }).catch((message) => {
                    console.log(message);
                    sendResponse(false);
                })
            }

            return true;
        });
    }

    upgradeStorage() {
        chrome.storage.local.get(null, (oldStorage) => {
            // Return when we've already upgraded storage
            if ((oldStorage && oldStorage.settings && oldStorage.settings.upgradedStorage) || Object.keys(oldStorage).length === 0) {
                console.log("We have already upgraded storage!");
                return;
            }

            chrome.storage.sync.get(null, (newStorage) => {
                // Push already synced sites to the local storage,
                // and then push all sites from local storage to the sync storage
                oldStorage.sites.push(...newStorage.sites);
                oldStorage.settings.upgradedStorage = true;

                chrome.storage.sync.set({ settings: oldStorage.settings, sites: oldStorage.sites }, () => {
                    console.log("Old items have been moved to sync!");
                });
            });
        });
    }
}

const extension = new Extension();
extension.upgradeStorage();
extension.listenForMessages();