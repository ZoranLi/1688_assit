const BASIC_TIME = 1200; //点击默认基础操作时间
const BASIC_FACTOR = 400;//点击默认随机因子
const BASIC_URL = 'http://apis.xiaohongchun.com/';//点击默认随机因子
// const BASIC_URL = 'http://api.tiantiandr.cn/';//点击默认随机因子

document.addEventListener('DOMContentLoaded', function () {
    console.log('1688购物插件');
    $(document).ready(function () {
        dealDomain();
    });
});

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

let query = parseQuery(location.href);

async function dealDomain() {
    setTimeout(() => {
        if (location.host.includes('detail.1688.com')) {//1688网站
            if (query.guige && query.oid && query.category) {
                readExcel().then(resp => {
                    setTimeout(() => {
                        dealGoodsDetail(query.guige);
                    }, 4000)
                })
            }
        } else if (location.host.includes('order.1688.com')) {
            dealConfirmPage();
        } else if (location.host.includes('cart.1688.com')) {
            dealCartPage()
        } else if (location.host.includes('trade.1688.com')) {
            getLocalStorageValue("CURRENT_ORDER").then(currentOrderResp => {
                currentOrderResp = currentOrderResp['CURRENT_ORDER']
                delay(getRandomFactor(1000)).then(function () {
                    chrome.extension.sendMessage({
                        type: 'update',
                        url: currentOrderResp.sku_list[0]
                    }, function (res) {//关闭当前页面 抓取下一个
                    });
                })
            })
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
function dealGoodsDetail(guige) {
    let tableSku = $(".table-sku");
    let tbody = tableSku ? tableSku.children() : null;
    let end;
    tbody.children().each(function (e) {
        if (!end) {
            let attrValue = $(this).attr('data-sku-config');//获取规格信息
            let skuInfo = JSON.parse(attrValue);
            //"{"skuName":"奶油白","isMix":"false","max":"21771","min":"0","mixAmount":"0","mixNumber":"0","mixBegin":"0","wsRuleUnit":"","wsRuleNum":""}"
            if (skuInfo.skuName && skuInfo.skuName === (guige) && skuInfo.max > 1) { //是透明色的
                $(this)[0].getElementsByClassName('amount-up')[0].click()
                end = true;
            }
        }
    });
    if(!end){
        return alert(`没有找到【${query.guige}】 规格`)
    }

    if (tbody) {
        //加入进货单 当前要是组套就加入进货单
        let addPurchase = $("span:contains(加入进货单)");
        if (addPurchase) {
            delay(getRandomFactor(200)).then(function () {
                addPurchase.parent()[0].click();
            })
        }
        delay(getRandomFactor(500)).then(function () {
            getLocalStorageValue("CURRENT_ORDER").then(currentOrderResp => {
                currentOrderResp = currentOrderResp['CURRENT_ORDER']
                if (currentOrderResp) {
                    let list = currentOrderResp.sku_list
                    let index = list.findIndex(g => decodeURI(location.href).includes(g));
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                    currentOrderResp.sku_list = list;
                    if (list && list.length) {
                        chrome.storage.local.set({"CURRENT_ORDER": currentOrderResp}, function () {
                            delay(getRandomFactor(2000)).then(function () {
                                chrome.extension.sendMessage({
                                    type: 'update',
                                    url: currentOrderResp.sku_list[0]
                                }, function (res) {//关闭当前页面 抓取下一个
                                });
                            })

                        });
                    } else {
                        // // 去结算
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
                    }
                } else {
                    alert("currentOrderResp为空")
                    // 去结算
                    // let settlementInt = setInterval(() => {
                    //     //去结算
                    //     let toSettlement = $("a:contains(去结算)");
                    //     if (toSettlement && toSettlement.is(":visible")) {
                    //         delay(200).then(function () {
                    //             toSettlement[0].click()
                    //         });
                    //         clearInterval(settlementInt)
                    //     }
                    // }, 200)
                }
            })
        })

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
    return new Promise((resolve, reject) => {
        try {
            if (query.clear_all) {
                chrome.storage.local.set({"ORDER_LIST": null, "CURRENT_ORDER": null}, function () {
                });
            }
            getLocalStorageValue("ORDER_LIST").then(orderListResp => {
                if (orderListResp['ORDER_LIST'] && orderListResp['ORDER_LIST'].length) {
                    resolve(orderListResp['ORDER_LIST']);
                    return;
                }
                $.getJSON(chrome.extension.getURL("order_list.json"), null, function (data) {

                    $.getJSON(chrome.extension.getURL("url_list.json"), null, urlObj => {
                        data.map(g => {
                            let skuList = [];
                            if (g.goods_name && g.goods_name.includes('暖冬新款')) {
                                skuList.push(`https://detail.1688.com/offer/628338995977.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=透明&oid=${g.oid}&category=暖冬新款`);
                                skuList.push(`https://detail.1688.com/offer/629812993921.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=35#珍珠矩形透明&oid=${g.oid}&category=暖冬新款`);
                                skuList.push(`https://detail.1688.com/offer/631107062502.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=${g.guige_name.substring(0, 2)}&oid=${g.oid}&category=暖冬新款`);
                                skuList.push(`https://detail.1688.com/offer/631894646191.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=大号半圆带耳朵&oid=${g.oid}&category=暖冬新款`);
                            } else if (g.goods_name.includes('气质仙女')) {
                                skuList.push(`https://detail.1688.com/offer/629812993921.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=35#珍珠矩形透明&category=气质仙女&oid=${g.oid}`)
                                skuList.push(`https://detail.1688.com/offer/631107062502.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=${g.guige_name.substring(0, 2)}&category=气质仙女&oid=${g.oid}`)
                                skuList.push(`https://detail.1688.com/offer/629812993921.html?spm=a360q.8274423.0.0.50f94c9ak6fOaP&guige=24#热卖珍珠两件套&category=气质仙女&oid=${g.oid}`)
                            }
                            g.sku_list = skuList;
                        });
                        console.log(JSON.stringify(data));
                        chrome.storage.local.set({"ORDER_LIST": data, "CURRENT_ORDER": data[0]}, function () {
                            resolve(data);
                            // getLocalStorageValue("CURRENT_ORDER").then(resp => {
                            //     resp = resp['CURRENT_ORDER'];
                            // })
                        });
                    })
                })
            })
        }
        catch (ex) {
            reject(ex);
        }
    });
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

                getLocalStorageValue("CURRENT_ORDER").then(currentOrderResp => {
                    currentOrderResp = currentOrderResp['CURRENT_ORDER']
                    let address = `${currentOrderResp.receiver} ${currentOrderResp.mobile} ${currentOrderResp.province} ${currentOrderResp.city}  ${currentOrderResp.area} ${currentOrderResp.detail} `
                    setKeywordText($("[class='copy-address input lang-input']")[0], address)
                    clearInterval(id)
                    delay(getRandomFactor(200)).then(function () {
                        let autoComplete = $('button:contains(自动匹配地址)');
                        if (autoComplete[0]) {
                            autoComplete[0].click();
                            // 兼容详细地址会错的问题，需要将Excel中详细地址取出来单独设置一下
                            delay(getRandomFactor(200)).then(function () {
                                let detailAddress = $("dt:contains(详细地址)");
                                if (detailAddress[0]) {
                                    detailAddress[0].parentElement.getElementsByTagName('textarea')[0].click();
                                    detailAddress[0].parentElement.getElementsByTagName('textarea')[0].focus();
                                    setKeywordText($("[class='input lang-input input-address']")[0], `${currentOrderResp.detail}`)
                                    detailAddress[0].click();
                                    delay(getRandomFactor(300)).then(function () {
                                        // 确认收货
                                        let receiveInfo = $("a:contains(确认收货信息)");
                                        receiveInfo[1].click();

                                        getLocalStorageValue("ORDER_LIST").then(orderListResp => {
                                            // chrome.storage.local.set({"ORDER_LIST": null, "CURRENT_ORDER": null}, function () {
                                            // });
                                            let orderList = orderListResp["ORDER_LIST"];
                                            getLocalStorageValue("CURRENT_ORDER").then(order => {
                                                let dealOrder = order["CURRENT_ORDER"];
                                                let index = orderList.findIndex(g => g.oid === dealOrder.oid)
                                                if (index !== -1) {
                                                    orderList.splice(index, 1)
                                                }


                                                //删除已经完成的元素，再提交订单
                                                chrome.storage.local.set({
                                                    "ORDER_LIST": orderList,
                                                    "CURRENT_ORDER": orderList[0]
                                                }, function () {
                                                    delay(getRandomFactor(200)).then(() => {
                                                        //提交订单
                                                        let commitOrder = $("a:contains(提交订单)");
                                                        commitOrder[0].click();
                                                    });
                                                });

                                            })
                                        });


                                    })
                                }
                            });
                        }
                    });
                })
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


