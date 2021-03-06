chrome.runtime.onMessage.addListener(function (message, callback, sendResponse) {
    if (message.type === "close") {
        chrome.tabs.remove(message.tabId);
    } else if (message.type === "update") {
        chrome.tabs.update(message.tabId, {url: message.url})
    }
});

chrome.extension.onMessage.addListener(
    function (message, sender, sendResponse) {
        if (message.type === 'getTabId') {
            sendResponse({tabId: sender.tab.id});
        } else if (message.type === "request") {
            let {url, method, body} = message
            fetchRemoteData(url, method, body, sendResponse)
        }
    }
);

/**
 * 发请求
 * @param url
 * @param method
 * @param body
 * @param callback
 */
function fetchRemoteData(url, method, body, callback) {
    let that = this
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            var resp = JSON.stringify(xhr.responseText)
            resp = JSON.parse(resp)
            if (resp && resp.includes('result')) {
                deleteElement(body.did);
                callback(resp)
            } else {
                chrome.storage.local.set({"STORAGE_GOOODS_LIST": JSON.parse(resp)}, function () {
                });
            }
        }
    };
    xhr.send(JSON.stringify(body));
}


async function deleteElement(did) {
    let goodsList = await getLocalStorageValue("STORAGE_GOOODS_LIST");
    goodsList = goodsList['STORAGE_GOOODS_LIST']

    if (typeof  goodsList === 'string') {
        goodsList = JSON.parse(goodsList)
    }

    if (goodsList && goodsList.length) {
        //上报完成就删掉本地list
        let tempIndex = goodsList.findIndex((e) => {
            return e.includes(did)
        });
        if (tempIndex !== -1) {
            goodsList.splice(tempIndex, 1);
            chrome.storage.local.set({"STORAGE_GOOODS_LIST": goodsList}, function () {
            });
        }
    }
}

/**
 * 获取storage的值
 * @param key
 * @returns {Promise<any>}
 */
async function getLocalStorageValue(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(key, function (value) {
                resolve(value);
            })
        }
        catch (ex) {
            reject(ex);
        }
    });
}

/**
 * 格式化queryparams 获取 refer中的ID
 * @param str
 * @returns {{}}
 */
function parseQuery(str) {
    if (typeof str != "string" || str.length == 0) return {};
    if (str.includes('?')) {
        str = str.split('?')[1]
    }
    var s = str.split("&");
    var s_length = s.length;
    var bit, query = {}, first, second;
    for (var i = 0; i < s_length; i++) {
        bit = s[i].split("=");
        first = decodeURIComponent(bit[0]);
        if (first.length == 0) continue;
        second = decodeURIComponent(bit[1]);
        if (typeof query[first] == "undefined") query[first] = second;
        else if (query[first] instanceof Array) query[first].push(second);
        else query[first] = [query[first], second];
    }
    return query;
}

