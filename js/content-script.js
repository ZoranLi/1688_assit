const BASIC_TIME = 2200; //点击默认基础操作时间
const BASIC_FACTOR = 400;//点击默认随机因子
const BASIC_URL = 'http://apis.xiaohongchun.com/';//点击默认随机因子
// const BASIC_URL = 'http://api.tiantiandr.cn/';//点击默认随机因子

document.addEventListener('DOMContentLoaded', function () {
    console.log('1688购物插件');
    $(document).ready(function () {
        dealDomain();
    });
});

function dealDomain() {
    setTimeout(() => {
        if (location.host.includes('detail.1688.com')) {//1688网站
            readExcel();
            setTimeout(() => {
                dealGoodsDetail();
            }, 4000)
        } else if (location.host.includes('order.1688.com')) {
            dealConfirmPage();
        } else if (location.host.includes('cart.1688.com')) {
            dealCartPage()
        }
    }, 1000)
}


/**
 * 处理结算单页面
 */
function dealCartPage() {
    //全选
    let checkAllBox = $('.lang-checkbox')[0];
    if (checkAllBox) {
        checkAllBox.getElementsByTagName('label')[0].click();
    }

    // 删除  清空页面
    // let deleteAll = $("a:contains(删除)");
    // delay(200).then(function () {
    //     deleteAll[0].click();
    // })

    //去结算
    let submit = $("button:contains(结算)");
    if (submit) {
        submit[0].click();
    }
}


/**
 * 处理商品详情页面
 */
function dealGoodsDetail() {
    let tableSku = $(".table-sku");
    let tbody = tableSku ? tableSku.children() : null;
    let end;
    tbody.children().each(function (e) {
        if (!end) {
            let attrValue = $(this).attr('data-sku-config');//获取规格信息
            let skuInfo = JSON.parse(attrValue);
            //"{"skuName":"奶油白","isMix":"false","max":"21771","min":"0","mixAmount":"0","mixNumber":"0","mixBegin":"0","wsRuleUnit":"","wsRuleNum":""}"
            if (skuInfo.skuName && skuInfo.skuName.includes('透明') && skuInfo.max > 1) { //是透明色的
                $(this)[0].getElementsByClassName('amount-up')[0].click()
                end = true;
            }
        }
    });

    if (tbody) {
        //加入进货单 当前要是组套就加入进货单
        let addPurchase = $("span:contains(加入进货单)");
        if (addPurchase) {
            delay(200).then(function () {
                addPurchase.parent()[0].click();
            })
        };


        //TODO 去结算
        let settlementInt = setInterval(() => {
            //去结算
            let toSettlement = $("a:contains(去结算)");
            if (toSettlement && toSettlement.is(":visible")) {
                delay(200).then(function () {
                    toSettlement[0].click()
                });
                clearInterval(settlementInt)
            }
        }, 200)

        //TODO 立即订购 当前要是单品就直接订购
        // let orderNow = $("span:contains(立即订购)");
        // if (orderNow) {
        //     setTimeout(() => {
        //         orderNow.parent()[0].click();
        //     }, getRandomFactor(1000))
        // }
    }


}

/**
 * 模拟键盘输入
 * @param el
 * @param text
 */
function setKeywordText(el, text) {
    // var el = document.getElementById("gwt-debug-keywords-text-area");
    el.value = text;
    var evt = document.createEvent("Events");
    evt.initEvent("change", true, true);
    el.dispatchEvent(evt);
}

/**
 * 读取excel文件
 */
function readExcel() {
    $.getJSON(chrome.extension.getURL("order_list.json"), {}, function (data) {
        // alert(JSON.stringify(data))
        chrome.storage.local.set({"ORDER_LIST": JSON.stringify(data)}, function () {
        });
    })
}


/**
 * 处理确认订单页面
 */
function dealConfirmPage() {
    //点击使用临时地址
    let tempAddress = $("a:contains(使用临时地址)");
    setTimeout(() => {
        if (tempAddress[0]) {
            tempAddress[0].click();
        }
    }, getRandomFactor(300));
    setTimeout(() => {
        let id = setInterval(() => {
            if ($("[class='copy-address input lang-input']")[0]) {
                $("[class='copy-address input lang-input']").click();
                $("[class='copy-address input lang-input']").focus();
                // setKeywordText($("[class='copy-address input lang-input']")[0], '曾杏 江西省 宜春市 袁州区 天宝路与高安路交汇处恒利·宜悦城 15600277777')
                setKeywordText($("[class='copy-address input lang-input']")[0], '曾杏 15979540486 江西省 宜春市 袁州区 天宝路与高安路交汇处恒利·宜悦城 ')
                clearInterval(id)
                delay(getRandomFactor(200)).then(function () {
                    let autoComplete = $('button:contains(自动匹配地址)');
                    if (autoComplete[0]) {
                        autoComplete[0].click();

                        //TODO 兼容详细地址会错的问题，需要将Excel中详细地址取出来单独设置一下
                        delay(getRandomFactor(200)).then(function () {
                            let detailAddress = $("dt:contains(详细地址)");
                            if (detailAddress[0]) {
                                detailAddress[0].parentElement.getElementsByTagName('textarea')[0].click();
                                detailAddress[0].parentElement.getElementsByTagName('textarea')[0].focus();
                                setKeywordText($("[class='input lang-input input-address']")[0], '天宝路与高安路交汇处恒利·宜悦城1111')
                                detailAddress[0].click();
                                delay(getRandomFactor(300)).then(function () {
                                    //TODO 确认收货
                                    let receiveInfo = $("a:contains(确认收货信息)");
                                    receiveInfo[1].click();
                                })
                            }
                        });
                    }
                });
            }
        }, 500)
    }, 500)

}


/**
 * 获取当前tabId
 * @returns {Promise<any>}
 */
async function getCurrentTabId() {
    return new Promise((resolve, reject) => {
        try {

            chrome.extension.sendMessage({type: 'getTabId'}, function (res) {
                // saveObject({"TAB_DID": res.tabId})
                resolve(res.tabId);
            });
        } catch (ex) {
            reject(ex);
        }
    });

}

/**
 *上报爆料的did
 */
async function setDidKey() {
    /**
     * @type {{}}
     */
    let parseObj = parseQuery(location.href);
    let parseReferrerObj = parseQuery(document.referrer);
    let did = parseObj.did;
    let did_array = parseObj.did_array;
    if (!did) {
        did = parseReferrerObj.did
    }
    if (!did_array) {
        did_array = parseReferrerObj.did_array
    }

    if (did && did_array) {

        chrome.extension.sendMessage({type: 'getTabId'}, function (res) {
            saveObject({"TAB_DID": res.tabId})
        });

        chrome.storage.local.set({
            "STORAGE_DID": did,
        }, function () {
            console.log('Value is set to' + did);
        });

        const gooodsList = await getLocalStorageValue("STORAGE_GOOODS_LIST");
        if (!(gooodsList && gooodsList.length)) {//如果没有数据
            chrome.runtime.sendMessage({
                    type: "request",
                    url: `${BASIC_URL}admin/v1/disclosure/query_sync_goods?did_array=${did_array}`,
                    method: "GET"
                },
                function (res) {

                });
        }
    }
    /*else {
           chrome.storage.local.set({
               "STORAGE_DID": null,
               "STORAGE_GOOODS_LIST": null
           }, function () {
               console.log('Value is set to' + did);
           });
       }*/

    // /**
    //  * 读取本地文件
    //  */
    // $.getJSON(chrome.extension.getURL("order_list.json"), {}, function (data) {
    //     chrome.storage.local.set({"STORAGE_GOOODS_LIST": JSON.stringify(data)}, function () {
    //         console.log('Value is set to' + did);
    //     });
    // })
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


function delay(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('');
        }, getRandomFactor(time));
    });
}

/**
 * 延时等待函数
 * @param time
 * @returns {Promise<any>}
 */
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * 模拟随机点击事件
 * @param time
 * @param factor 随机因子 默认400ms
 * @returns {number}
 */
function getRandomFactor(time = BASIC_TIME, factor = BASIC_FACTOR) {
    let random = Math.round(Math.random() * 8);//模拟用户点击 随机时间
    return time + random * factor;
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
