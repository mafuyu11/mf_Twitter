function stringToXML(xmlStr) {
    var xmldom = '';
    if (window.ActiveXObject) {
        xmldom = new ActiveXObject("Microsoft.XMLDOM");
        xmldom.async = false;
        xmldom.loadXML(xmlStr);
    }
    else {
        var parser = new DOMParser();
        xmldom = parser.parseFromString(xmlStr, "text/xml");
    }
    return xmldom;
}

function isIE() {
    var flag = false;
    if (window.ActiveXObject) {
        alert('IE에서는 사용 불가 합니다.');
        window.history.go(-1);
        flag = true;
    }

    return flag;
}

function AjaxToRequest() {
    var req;
    if (!window.ActiveXObject) {
        req = new XMLHttpRequest();
    }
    else {
        req = new ActiveXObject("Microsoft.XMLHTTP");
    }

    return req;
}

/// ArrayJSON 이 먼저 실행 한 후에 트위터 JSON 데이터 Get..
/// 타입 : JSON (배열 프로퍼티)
var jsonData;

/// mf_twitter의 트위터 클래스
/// 개체 실행 순서 
/// ① : AuthConfig() 메서드
/// ② : AuthUrl() 메서드
/// ③ : ArrayJSON() 메서드
/// ④ : jsonData 변수 (JSON 배열)
function Twitter() {

}

/// 트위터 Auth 키 값 설정
/// 반환 : 설정된 Auth 배열 반환
/// api_key : 예전의 ConsumerKey와 같음.
/// api_secreat : 예전의 ConsumerSecreatKey와 같음
/// token_key : 토큰 키
/// token_secreat : 토큰 시크릿 키
/// screen_name : 조회/적용할 트위터 유저 ID
/// 반환 : Auth 및 유저 ID 가 포함된 배열
Twitter.prototype.AuthConfig = function (api_key, api_secreat,
    token_key, token_secreat, screen_name) {
    var arrConfig = [api_key, api_secreat, token_key, token_secreat, screen_name];
    return arrConfig;
}

/// AuthConfig가 설정 됬을 때, api에서 제공하는 JSON url을 받아서
/// 해당 카운트 만큼 데이터를 가져오는 url을 제공 
/// authConfig : 트위터 클래스 개체의 AuthConfig 값
/// 반환 : REST (파라미터, 쿼리스트링) 형식의 URL 문자열 반환 
Twitter.prototype.UserTimeLineUrl = function (authConfig) {

    var authMessage = {
        method: 'GET',
        action: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
        parameters: {
            count: 200,
            oauth_version: '1.0',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_consumer_key: authConfig[0],
            oauth_token: authConfig[2],
            screen_name: authConfig[4],
            callback: 'mf_callback'
        }
    }; // oauth 1.0 인증을 사용하는 트위터의 URL 특성상.. 다음과 같이 형식에 맟춰서 object로 보냅니다.
    // object 내 속성 네임은 oauth 1.0 라이브러리에서 지정한 대로 썼습니다.
    // 추가적인 파라미터 (쿼리스트링)은 parameters 내의 callback 다음으로 추가가 가능합니다.

    var authSecreat = {
        consumerSecret: authConfig[1],
        tokenSecret: authConfig[3]
    };

    OAuth.setTimestampAndNonce(authMessage);
    OAuth.SignatureMethod.sign(authMessage, authSecreat);

    return OAuth.addToURL(authMessage.action, authMessage.parameters);
}

/// AuthUrl 에서 주어진 URL을 통해 JSON 형식의 배열 값을 jsonData에 적용.
/// method : POST, GET 과 같은 전송 메서드 문자열
/// callbackURL : AuthUrl 에서 반환된 URL 문자열
/// 반환 : 전역 변수 twitterData에 JSON 형식의 배열 값을 적용
/// 선행 조건 : JQuery 필수
Twitter.prototype.GetJSON = function (method, callbackURL) {
    $.ajax({
        type: method,
        url: callbackURL,
        dataType: 'jsonp',
        jsonp: false,
        cache: true
    }); // pure 자바스크립트 내에서 해결 방안 모색 중 입니다.
    // 임시 방편으로 JQuery 라이브러리의 Ajax 처리 했습니다.

    mf_callback = function (data) {
        jsonData = data;
    } // json-p 방식으로 json을 가져오는 트위터 방식의 특성상, 콜백 함수 이름을 지정해야 했으며,
    // Ajax 처리 직 후, 생성되는 콜백 함수의 데이터 (json)를 가져오기 위해 사용 했습니다. 
}

Twitter.prototype.CallBackURLString = '';

Twitter.prototype.TwitterUserTimeLineOnList = function (jsonData, count) {
    if (!jsonData) return;
    var profileImg, userName, userAcc, link, texts, times, ids, account;
    var pdiv = document.createElement('div');
    for (var i = 0; i < count; i++) {
        var fdiv = document.createElement('div');
        var dataJ = jsonData[i];
        for (var jd in dataJ) {
            if (jd != 'user') {
                switch (jd) {
                    case 'created_at':
                        times = document.createElement('span');
                        times.setAttribute('id', jd);
                        times.innerHTML = dataJ[jd];
                        break;
                    case 'text':
                        texts = document.createElement('div');
                        texts.setAttribute('id', jd);
                        texts.innerHTML = dataJ[jd];
                        break;
                    case 'id_str':
                        ids = dataJ[jd];
                        break;
                }
            }
            else {
                var setUser = dataJ[jd];
                for (var sub in setUser) {
                    switch (sub) {
                        case 'name':
                            userName = document.createElement('span');
                            userName.setAttribute('id', sub);
                            userName.innerHTML = setUser[sub];
                            break;
                        case 'screen_name':
                            userAcc = document.createElement('span');
                            var child = document.createElement('a');
                            userAcc.setAttribute('id', sub);
                            child.setAttribute('href', 'https://twitter.com/#!/' + setUser[sub]);
                            child.innerHTML = '@' + setUser[sub];
                            userAcc.appendChild(child);
                            account = setUser[sub];
                            break;
                        case 'profile_image_url':
                            profileImg = document.createElement('span');
                            var ch = document.createElement('a');
                            var Img = document.createElement('img');
                            profileImg.setAttribute('id', sub);
                            Img.setAttribute('src', setUser[sub]);
                            ch.setAttribute('href', 'https://twitter.com/#!/' + account);
                            ch.appendChild(Img);
                            profileImg.appendChild(ch);
                            profileImg.setAttribute('rowspan', '2');
                            break;
                    }
                }
                link = document.createElement('a');
                link.setAttribute('href', 'https://twitter.com/#!/' + account + '/status/' + ids);
                link.setAttribute('colspan', '4');
                link.innerHTML = 'https://twitter.com/#!/' + account + '/status/' + ids;
            }
        }
        fdiv.appendChild(profileImg);
        fdiv.appendChild(userName);
        fdiv.appendChild(userAcc);
        fdiv.appendChild(texts);
        fdiv.appendChild(link);
        fdiv.appendChild(times);
        fdiv.className = 'mf_class_sub';
        pdiv.appendChild(fdiv);
    }
    pdiv.className = 'mf_class_main';
    return pdiv;
}

/// 트위터 검색 할때 사용하는 파라미터 (쿼리 스트링) 값을 지정
/// q : 검색어 (# 해시태그 제외한 검색어)
/// result_type : 결과정렬 (recent, popular, mix) 
/// filter : 검색 필터 (images 등..)
Twitter.prototype.SearchConfig = function (q, result_type, filter) {
    if (filter != '' && filter != null) {
        q = '#' + q + ' -RT filter:' + filter; // ' -RT filter:images';
    }
    var arrConfig = [q, result_type];
    return arrConfig;
}

/// 트위터 검색결과를 가진 콜백 주소 반환
/// authConfig : 인증관련 설정 (AuthConfig) 값 지정
/// searchConfig : 검색 관련 설정 (SearchConfig) 값 지정 
Twitter.prototype.SearchUrl = function (authConfig, searchConfig) {

    var authMessage = {
        method: 'GET',
        action: 'https://api.twitter.com/1.1/search/tweets.json',
        parameters: {
            count: 200,
            oauth_version: '1.0',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_consumer_key: authConfig[0],
            oauth_token: authConfig[2],
            screen_name: authConfig[4],
            callback: 'mf_callback',
            src: 'hash',
            q: searchConfig[0],
            result_type: searchConfig[1]
        }
    };

    var authSecreat = {
        consumerSecret: authConfig[1],
        tokenSecret: authConfig[3]
    };

    OAuth.setTimestampAndNonce(authMessage);
    OAuth.SignatureMethod.sign(authMessage, authSecreat);

    var url = OAuth.addToURL(authMessage.action, authMessage.parameters);

    this.CallBackURLString = url;

    return url;
}

function isMobile(targetWindow) {
    var flag = false;
    if (targetWindow.navigator.userAgent.indexOf('Android') > -1
    || targetWindow.navigator.userAgent.indexOf('iPhone') > -1
    || targetWindow.navigator.userAgent.indexOf('iPod') > -1
    || targetWindow.navigator.userAgent.indexOf('PodBlackBerry') > -1
    || targetWindow.navigator.userAgent.indexOf('webOS') > -1
    || targetWindow.navigator.userAgent.indexOf('Windows Phone') > -1) {
        flag = true;
    }

    return flag;
}

var arrangeflag = false;
function arrangeList() {

    try {
        var rowCnt = mf_tweet_tbl.rows.length;
        for (var i = 0; i < rowCnt; i++) {
            if (isMobile(window) == false) {
                if (mf_tweet_tbl.rows[i].cells.length != 5) {
                    mf_tweet_tbl.rows[i].remove();
                    arrangeflag = true;
                }
            }
            else {
                if (mf_tweet_tbl.rows[i].cells.length != 2) {
                    mf_tweet_tbl.rows[i].remove();
                    arrangeflag = true;
                }
            }
        }
    }
    catch (e) { arrangeList(); }
}

Twitter.prototype.ImageSearchResultToList = function (jsonData, count, imageWidth) {
    var pDiv, imgTag, ank, spTag;
    if (typeof (jsonData) != 'undefined' || jsonData != null) {
        var datas = jsonData['statuses'];
        var root = document.createElement('div');
        root.className = 'mf_class_main';
        root.setAttribute('id', 'mf_tweet_tbl');
        var arr = new Array();
        for (var i = 0; i < datas.length; i++) {

            var dt = datas[i].entities;
            var user = datas[i].user.name;
            for (var media in dt) {
                if (media == 'media') {
                    arr.push(dt[media]);
                }
            }
        }
        pDiv = document.createElement('div');
        pDiv.className = 'scrollView';

        for (var i = 0; i < count; i++) {
            try {
                if (arr[i][0].expanded_url.indexOf('bot') > -1) {
                    i = i + 1;
                    continue;
                }

                spTag = document.createElement('span');
                spTag.setAttribute('num', i);
                spTag.setAttribute('style', 'vertical-align: middle; display: inline-block;');
                spTag.className = 'selSpan';

                if (parseInt(imageWidth)) {

                    ank = document.createElement('a');
                    ank.setAttribute('href', arr[i][0].expanded_url);
                    ank.setAttribute('target', '_blank');
                    ank.setAttribute('style', 'border: none;');

                    imgTag = document.createElement('img');
                    imgTag.setAttribute('src', arr[i][0].media_url);

                    if (window.navigator.userAgent.indexOf('Trident') > -1) {
                        imgTag.style.cssText = 'width: ' + imageWidth + 'px; height: 70%; padding: 5px 5px; border: none; display: inline-block;';
                    }
                    else {
                        imgTag.setAttribute('style', 'width: ' + imageWidth + 'px; height:' + (imageWidth + 140) + ' px; padding: 5px 5px; border: none; display: inline-block;');
                    }

                    ank.appendChild(imgTag);
                    spTag.appendChild(ank);
                }
            }
            catch (e) { }

            pDiv.appendChild(spTag);
            root.appendChild(pDiv);
        }

        return root;
    }
    else {
        //this.ImageSearchResultToList(jsonData, count, imageWidth);
        return '재시도 해주세요..';
    }
}

Twitter.prototype.ListConfig = function (slug, ownerScreenName, listID) {
    var arrConfig = [slug, ownerScreenName, listID];
    return arrConfig;
}

Twitter.prototype.FindListIdURL = function (authConfig, screenName) {
    var authMessage = {
        method: 'GET',
        action: 'https://api.twitter.com/1.1/lists/list.json',
        parameters: {
            count: 10,
            oauth_version: '1.0',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_consumer_key: authConfig[0],
            oauth_token: authConfig[2],
            screen_name: authConfig[4],
            callback: 'mf_callback',
            screen_name: screenName
        }
    };

    var authSecreat = {
        consumerSecret: authConfig[1],
        tokenSecret: authConfig[3]
    };

    OAuth.setTimestampAndNonce(authMessage);
    OAuth.SignatureMethod.sign(authMessage, authSecreat);

    var url = OAuth.addToURL(authMessage.action, authMessage.parameters);

    this.CallBackURLString = url;

    return url;
}

Twitter.prototype.ListStatusURL = function (authConfig, listConfig) {
    var authMessage = {
        method: 'GET',
        action: 'https://api.twitter.com/1.1/lists/statuses.json',
        parameters: {
            count: 200,
            oauth_version: '1.0',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_consumer_key: authConfig[0],
            oauth_token: authConfig[2],
            screen_name: authConfig[4],
            callback: 'mf_callback',
            owner_screen_name: listConfig[1],
            slug: listConfig[0],
            list_id: listConfig[2]
        }
    };

    var authSecreat = {
        consumerSecret: authConfig[1],
        tokenSecret: authConfig[3]
    };

    OAuth.setTimestampAndNonce(authMessage);
    OAuth.SignatureMethod.sign(authMessage, authSecreat);

    var url = OAuth.addToURL(authMessage.action, authMessage.parameters);

    this.CallBackURLString = url;

    return url;
}

Twitter.prototype.ListStatusToTable = function (jsonData, count) {
    var pDiv, imgTag, ank, spTag;
    if (typeof (jsonData) != 'undefined' || jsonData != null) {
        var root = document.createElement('div');
        root.className = 'mf_class_main';
        root.setAttribute('id', 'mf_list_Tbl');

        pDiv = document.createElement('div');
        pDiv.className = 'scrollView';

        for (var i = 0; i < count; i++) {
            var datas = jsonData[i];
            spTag = document.createElement('span');
            spTag.setAttribute('num', i);

            var divAnk = document.createElement('a');
            divAnk.setAttribute('style', 'border: none;');
            divAnk.setAttribute('target', '_blank');

            var spDiv = document.createElement('div');
            spDiv.setAttribute('style', 'border: #f5f8fa 1px solid; display: block;');
            spDiv.className = 'selDiv';

            var txt = document.createElement('div');
            var name = document.createElement('span');

            var viewID = '';
            var viewSpan = document.createElement('span');
            for (var obj in datas) {
                switch (obj) {
                    case 'id_str':
                        viewID = datas[obj];
                        break;

                    case 'text':
                        if (datas[obj].indexOf('http:') > -1) {//

                            txt.innerHTML = datas[obj].split('http:')[0]
                            + '<a href="http:' + datas[obj].split(/http:/g)[1].split(/\n|\r\n| |　|\)/g)[0] + '" target="_blank">http:'
                            + datas[obj].split(/http:/g)[1].split(/\n|\r\n| |　|\)/g)[0] + '</a>';
                        }
                        else {
                            txt.innerHTML = datas[obj];
                        }
                        spTag.appendChild(txt);
                        break;

                    case 'user':
                        var users = datas[obj];
                        for (var us in users) {
                            switch (us) {
                                case 'name':
                                    name.innerHTML = '<br /><br />' + users[us] + '　';
                                    spTag.appendChild(name);
                                    break;

                                case 'url':
                                    ank = document.createElement('a');
                                    imgTag = document.createElement('img');
                                    imgTag.setAttribute('style', 'border: none;');
                                    imgTag.setAttribute('src', users['profile_image_url']);

                                    if (users[us] != null && users[us] != 'null') {
                                        ank.setAttribute('target', '_blank');
                                        ank.setAttribute('href', users[us]);
                                        ank.setAttribute('style', 'border: none;');

                                        ank.appendChild(imgTag);
                                        spTag.appendChild(ank);
                                    }
                                    else {
                                        spTag.appendChild(imgTag);
                                    }
                                    break;

                                case 'screen_name':
                                    divAnk.setAttribute('href', 'https://twitter.com/#!/' + users[us] + '/status/' + viewID);
                                    divAnk.innerHTML = 'view';
                                    viewSpan.innerHTML = '　';
                                    viewSpan.appendChild(divAnk);
                                    break;
                            }
                        }
                        break;
                }
                spTag.appendChild(viewSpan);
                spDiv.appendChild(spTag);
                pDiv.appendChild(spDiv);
            }
        }
        root.appendChild(pDiv);

        return root;
    }
    else {
        return '재시도 해주세요..';
    }
}

function arrangeListToCell(listTbl, count) {
    try {
        for (var i = 0; i < count; i++) {
            var cellCnt = listTbl.rows[i].cells.length;
            for (var j = 0; j < cellCnt; j++) {
                if (listTbl.rows[i].cells[j].innerHTML == '') {
                    listTbl.rows[i].cells[j].remove();
                }
            }
        }
    }
    catch (e) {
        arrangeListToCell(listTbl, count);
    }
}
