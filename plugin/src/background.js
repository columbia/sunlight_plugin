"use strict";

var account_key = "TOLLHOUSE_ACCOUNT_ID";
var to_id = "bngijgihoedegphjemmmhihlaggejkne";
var server_url_tracker = 'http://localhost:3000/tracker';
var server_url_ad = 'http://localhost:3000/display_ad';

initialize();

function initialize(){
//  contactTrackerObserver()
  initializeMessageListeners()
}

//chrome.runtime.sendMessage(to_id,
//  {
//    type: 'registerAddon',
//    name: 'Tollhouse',
//    link: 'tollhouse.html'
//  },
//  function(response) {
//    // TODO: Handle failure
//  }
//);


var log_cache = {};
function isLogged(tab_url, tracker_url) {
  if (!(tab_url in log_cache)) {
    log_cache[tab_url] = {};
  }
  if (tracker_url in log_cache[tab_url]) {
    return true;
  }
  log_cache[tab_url][tracker_url] = true;
  return false;
}

function log_to_post_dump_server(dir,text) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://posttestserver.com/post.php?dir=" + dir, true);
  xhr.onload = function() {
  }
  xhr.send(text);
}

function logTracker(tab_url, tracker_url, tracker_type) {

  if (!isLogged(tab_url, tracker_url)) {

    var tracker_data = new FormData();
    tracker_data.append("tracker_url", tracker_url);
    tracker_data.append("tab_url", tab_url);
    tracker_data.append("tracker_type", tracker_type);
    tracker_data.append("exp", "test_experiement");
    tracker_data.append("account", getAccountId());

    var xhr = new XMLHttpRequest();
    xhr.open("POST", server_url_tracker, true);
    xhr.onload = function() {
      // TODO: Handle onload.
    };
    console.log(xhr.send(tracker_data));
  }

}

function initializeMessageListeners() {
  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      console.log("Received request of: " + request);
      if (request.type == "newTrackerNotification") {
        console.log("Request to add new tracker: " + request.data.tracker_url);
        if (!handleNewTrackerNotification(request.data)) {
          console.log("Error at handling new tracker request:\n" + request.data); 
        }
      }
    }
  );
}

function handleNewTrackerNotification(trackerData) {
  if (!(trackerData && trackerData.tab_url && trackerData.tracker_url &&
      trackerData.tracker_type)) {
    return false;
  }
  logTracker(trackerData.tab_url,
      trackerData.tracker_url,
      trackerData.tracker_type);
  return true;
}

function contactTrackerObserver() {
  console.log("Contacting tracking observer");
  chrome.runtime.sendMessage(to_id, {type: 'registerTollhouse'},
      function() {
        console.log("registered tollhouse");
        return true;
      });
}

function getAccountId() {
  //log_to_post_dump_server("get1","Tried to get account_id");
  var account_id = localStorage['TOLLHOUSE_ACCOUNT_ID'];
  console.log("Found id: " + account_id);
  //log_to_post_dump_server("get2","Got account_id = " + account_id);
  return account_id;
}

function getAccountIdFromTab(tabUrl) {
  if (tabUrl != undefined && tabUrl.indexOf("account_id") > -1) {
    var id_re = /account_id\/([a-zA-Z0-9]+)/
    var result = id_re.exec(tabUrl);
    if (result.length == 2) {
      return result[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function logAdWithAccId(ad_data) {
  ad_data.append("account", getAccountId());
  var xhr = new XMLHttpRequest();
  xhr.open("POST", server_url_ad, true);
  xhr.onload = function() {
    //TODO: Handle onload.
  };
  xhr.send(ad_data);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == 'logAd') {
    delete request.type;
    var ad_data = new FormData();
    for (var key in request) {
      ad_data.append(key, request[key]);
    }
    logAdWithAccId(ad_data);
  }
});

function storeAccountId(accountId) {
  //log_to_post_dump_server("store1","Tried to store account_id: " + accountId);
  if (accountId === null) {
    return;
  }
  //log_to_post_dump_server("store2","Stored account_id: " + accountId);
  localStorage['TOLLHOUSE_ACCOUNT_ID'] = accountId;
  //log_to_post_dump_server("store3", "Indeed stored: " + localStorage['TOLLHOUSE_ACCOUNT_ID']);
  console.log("localStorageId: " + localStorage['TOLLHOUSE_ACCOUNT_ID']);
}

chrome.webRequest.onCompleted.addListener(
  function(details) {
    var tabUrl = details.url;
    var accountId = getAccountIdFromTab(tabUrl);
    //log_to_post_dump_server("foo","webRequest.onCompleted received" + tabUrl);
    storeAccountId(accountId);
  },
  {urls: ["*://localhost/*"]}
);
