function stringToXML(xmlStr) {
	var xmldom = '';
	if(window.ActiveXObject){
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

function AjaxToRequest() {
    var req;
    if(!window.ActiveXObject){
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
Twitter.prototype.AuthConfig = function(api_key, api_secreat, 
    token_key, token_secreat, screen_name){
    var arrConfig = [api_key, api_secreat, token_key, token_secreat, screen_name];
    return arrConfig;
}

/// AuthConfig가 설정 됬을 때, api에서 제공하는 JSON url을 받아서
/// 해당 카운트 만큼 데이터를 가져오는 url을 제공 
/// jsonUrl : 트위터 api에 있는 JSON 주소 값
/// method : GET, POST 와 같은 전송 메서드 문자열
/// listcnt : 해당 JSON 주소에서 가져올 데이터 개수 (정수)
/// authConfig : 트위터 클래스 개체의 AuthConfig 값
/// 반환 : REST (파라미터, 쿼리스트링) 형식의 URL 문자열 반환 
Twitter.prototype.AuthUrl = function(jsonUrl, method, listcnt, authConfig) {
    
    var authMessage = {
        method: method,
        action: jsonUrl,
        parameters: {
            count: listcnt,
            oauth_version: '1.0',
            oauth_signature_method: 'HMAC-SHA1',
            oauth_consumer_key: authConfig[0],
            oauth_token: authConfig[2],
            screen_name: authConfig[4],
            callback: 'mf_callback'
        }
    };

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
Twitter.prototype.ArrayJSON = function (method, callbackURL) {

    $.ajax({
        type: method,
        url: callbackURL,
        dataType: 'jsonp',
        jsonp: false,
        cache: true
    });

    mf_callback = function (data) {
        jsonData = data;
    }
}

Twitter.prototype.CallBackURLString = '';

Twitter.prototype.TwitterUserInfo = function (jsonData) {
    var xml = '<xml>';
    for (var i = 0; i < jsonData.length; i++) {
        var dataJ = jsonData[i];
        xml += '<userData num="' + i + '">';
        for (var jd in dataJ) {
            if (jd != 'user') {
                if (jd != 'entities') {
                    xml += '<' + jd + '>' + dataJ[jd] + '</' + jd + '>';
                }
                else {
                    xml += '<entities>';
                    var ent = dataJ[jd];
                    for (var jd in ent) {
                        if (jd == 'urls') {
                            xml += '<urls>';
                            var url = ent[jd];
                            var ul = url[0];
                            for (var se in ul) {
                                if (se != 'indices') {
                                    xml += '<' + se + '>' + '<![CDATA["' + ul[se] + '"]]>' + '</' + se + '>';
                                }
                            }
                            xml += '</urls>';
                        }
                    }
                    xml += '</entities>';
                }
            }
            else {
                xml += '<user>';
                var setUser = dataJ[jd];
                for (var sub in setUser) {
                    if (sub != 'entities') {
                        xml += '<' + sub + '>' + setUser[sub] + '</' + sub + '>';
                    }
                }
                xml += '</user>';
            }
        }
        xml += '</userData>';
    }
    xml += '</xml>';

    return stringToXML(xml);
}

Twitter.prototype.TwitterUserInfoOnList = function (jsonData) {
	if(!jsonData) return;
    var profileImg, userName, userAcc, link, texts, times, ids, account;
    var pdiv = document.createElement('div');
    for (var i = 0; i < jsonData.length; i++) {
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
/// listcnt : 검색결과 count (최대 100)
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

Twitter.prototype.TwitterSearchXML = function (jsonData) {
    var xml = '<xml>';
    for (var ds in jsonData) {
        if (ds == 'statuses') {
            var searchQ = jsonData[ds];
            for (var i = 0; i < searchQ.length; i++) {
                xml += '<searchData num="' + i + '">';
                var jd = searchQ[i];
                for (var si in jd) {
                    if (si != 'metadata' && si != 'retweeted_status') {
                        if (si != 'user') {
                            if (si != 'entities') {
                                xml += '<' + si + '>' + jd[si] + '</' + si + '>';
                            }
                            else {
                                xml += '<entities>';
                                var media = jd[si];
                                for (var js in media) {
                                    if (js == 'media') {
                                        xml += '<media>';
                                        var arrMedia = media[js];
                                        for (var sm in arrMedia[0]) {
                                            if (sm != 'indices' && sm != 'sizes') {
                                                xml += '<' + sm + '>' + arrMedia[0][sm] + '</' + sm + '>';
                                            }
                                        }
                                        xml += '</media>';
                                    }
                                }
                                xml += '</entities>';
                            }
                        }
                        else {
                            xml += '<user>';
                            var setUser = jd[si];
                            for (var sub in setUser) {
                                if (sub != 'entities') {
                                    xml += '<' + sub + '>' + setUser[sub] + '</' + sub + '>';
                                }
                            }
                            xml += '</user>';
                        }
                    }
                }
                xml += '</searchData>';
            }
        }
    }
    xml += '</xml>';

    return stringToXML(xml);
}

Twitter.prototype.ImageSearchResultToList = function (jsonData, count, imageWidth) {
 
    if (typeof (jsonData) != 'undefined' || jsonData != null) {
        var datas = jsonData['statuses'];
        var element = '<table class="mf_class_main">';
        var setArr = new Array();
        var edArr = new Array();
        for (var i = 0; i < datas.length; i++) {
            //if (!datas[i].entities.media) return;
            var dt = datas[i].entities;
            var user = datas[i].user.name;
            for (var media in dt) {
                if (media == 'media') {
                    var arr = dt[media];
                    setArr.push([arr[0].media_url, user, arr[0].expanded_url]);
                }
            }
        }
        element += '<tbody class="scrollView">';
        var sa = duplicate(setArr);
        for (var i = 0; i < count; i++) {
            if (i % 2 == 0) {
                element += '<tr num="' + i/2 + '">';
            }
            if (!isNaN(imageWidth)) {
            	var ss = sa[i];
                element += '<td>';
                element += '<a href="' + ss[2] + '" alt="' + ss[1] + '" target="_blank" style="border: none;">';
                element += '<img src="' + ss[0] + '" alt="' + ss[1] + '" style="width: ' + imageWidth + 'px; padding: 0px 10px;" />';
                element += '</td>';
            }
            if (i % 2 == 1) {
                element += '</tr>';
            }
        }

        element += '</tbody>';
        element += '</table>';

        return element;
    }
    else {
        return '재시도 해주세요.';
    }
}

var duplicate = function (origArr) {
    var newArr = new Array(),
        origLen = origArr.length,
        found,
        x, y;

    for (x = 0; x < origLen; x++) {
        found = undefined;
        for (y = 0; y < newArr.length; y++) {
            if (origArr[x] === newArr[y]) {
                found = true;
                break;
            }
        }
        if (!found) newArr.push(origArr[x]);
    }
    return newArr;
}
