"use strict";

// Add site to storage
function addSite(tab, callback) {
    checkSite(tab.url, function(allowed) {
        if (!allowed) {
            return;
        }
        // Get a favicon properly
        if (!tab.favIconUrl || tab.favIconUrl.indexOf("chrome://theme") > -1) {
            tab.favIconUrl = chrome.runtime.getURL("../img/favicon.png");
        }
        chrome.storage.local.get("sites", function(storage) {
            var storage = storage["sites"] || [];
            var site = { title: tab.title, faviconUrl: tab.favIconUrl, url: tab.url };
            // Push site object into storage and save it
            storage.push(site);
            chrome.storage.local.set({sites: storage}, function() {
                callback();
            });
        });
    });
}

// Check site's url, whether note should be added or not
function checkSite(url, callback) {
    // URL may be undefined in some cases, GH #16
    if (url === undefined) {
        callback(false);
        return;
    }
    chrome.storage.local.get("sites", function(storage) {
        var sites = storage["sites"];
        if (!sites) {
            callback(true);
            return;
        }
        var allowed = true;
        for (let i=0; i<sites.length; i++) {
            var siteUrl = sites[i].url;
            if (siteUrl === url) {
                allowed = false;
                break;
            }
        }
        callback(allowed);
    });
}

// Remove site from storage
function removeSite(url, callback) {
    chrome.storage.local.get("sites", function(storage) {
        var sites = storage["sites"];
        if (!sites) {
            return;
        }
        for (let i=0; i<sites.length; i++) {
            if (sites[i].url === url) {
                sites.splice(i, 1);
                break;
            }
        }
        chrome.storage.local.set({sites: sites}, function() {
            callback();
        });
    });
}

// Get info about current tab
function getCurrentTabInfo(callback) {
    chrome.tabs.query({active: true}, function(tab) {
        callback(tab);
    });
}
