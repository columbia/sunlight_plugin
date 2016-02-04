var log_debug = false;


var to_id = "bngijgihoedegphjemmmhihlaggejkne";
var account_key = "TOLLHOUSE_ACCOUNT_ID"

function getAccountId() {
  try {
    account_id = window.localStorage.getItem(account_key);
    console.log("Found id: " + account_id);
    return account_id;
  } catch (e) {
    return null;
  }
}

function debugLog(msg) {
  if (log_debug) {
    console.log(msg);
  }
}

function hostFromURL(url)
{
  /** Hack from StackOverflow. */
  var doc = document.createElement("a");
  doc.href = url;
  return doc.hostname;
}

function getTrackersToBlock()
{
  var xhr = new XMLHttpRequest();
  console.log("GET from " + window.location.href);
  xhr.open("GET", window.location.href, false );
  xhr.send(null);
  toBlock = jQuery.parseJSON(xhr.responseText);
  console.log("Blocking: " + toBlock);
  return toBlock;
}

function blockTrackerDomains(domains)
{
  for (var i = 0; i < domains.length; i++) {
  chrome.runtime.sendMessage(to_id,
    {
      type: 'blockTrackerDomain',
      domain: domains[i]
    });
  }
}

$(document).ready(function() {
  var account_id_re = /\d+\/account_id/
  if (account_id_re.exec(window.location.href)) {
    console.log("Getting trackers to block.");
    trackersToBlock = getTrackersToBlock();
    blockTrackerDomains(trackersToBlock);
  } else {
    collectAds();
  }
});

function isHttps() {
  var proto = window.self.location.href.split(":")[0];
  return (proto.length === 5 && proto.charAt(proto.length - 1));

}

function getAdObject(adElement) {
  var obj = {};
  obj.src = $(adElement).attr('src');
  obj.url = window.location.href;
  obj.title = document.title;
  if ($(adElement).parent().attr('a')) {
    obj.anchor = $(adElement).parent().attr("href");
  } else {
    obj.anchor = "Not Sure Yet";
  }
  obj.id = $(adElement).attr('id');
  obj.tagType = $(adElement).tagName;
  obj.width = $(adElement).width();
  obj.height = $(adElement).height();
  return obj;
}

function isTopLevelAdDomain(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  for (var i = 0; i < abpTopLevelList; i++) {
    if (adObj.indexOf(abpTopLevelList[i]) != -1) {
      if ((window.sef === window.top) &&
         (abpTopLevelList[i].indexOf(adObj.currentURL) != -1 ||
         adObj.src.split('.')[1] == adObj.currentURL)) {
         continue;
      } else {
        debugLog("Found top level ad domain: " + abpTopLevelList[i]);
        return true;
      }
    }
  }
  return false;
}

function isURLSpam(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  for (var i = 0; i < abpURLSpam.length; i++) {
    if (adObj.src.indexOf(abpURLSpam[i]) != -1) {
      return true;
    }
  }
  return false;
}

function isBlackListDomain(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  for (var i = 0; i < abpBlackList; i++) {
    if (adObj.src.indexOf(abpBlackList[i]) != -1) {
      return true;
    }
  }
  return false;
}

function isSureThing(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  for (var i = 0; i < abpSureThing.length; i++) {
    if (adObj.src.indexOf(abpSureThing[i]) != -1) {
      return true;
    }
  }
  return false;
}

function isAdDomain(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  for (var i = 0; i < adDomains.length; i++) {
    if (adObj.src.indexOf(adDomains[i]) != -1) {
      return true;
    }
  }
  return false;
}

function isAdSize(adObj) {
  if (adObj.src === undefined) {
    return false;
  }
  /* Likely a tracking pixel and not and ad. */
  if (adObj.width < 10 && adObj.height < 10) {
    return false;
  }
  if (adObj.width > 100 && adObj.height > 100) {
    return false;
  }
  for (var i = 0; i < adSizes.length; i++) {
    if (adObj.width + " x " + adObj.height == adSizes[i]) {
      return true;
    }
  }
  return false;
}

function isElementNamedAd(adObj) {
  // TODO
  return false;
}

function isTrackingPixel(adObj) {
  if (adObj.width < 10 && adObj.height < 10) {
    return true;
  }
  return false;
}

function isAd(adObj) {
  var ignoreTrackingPixel = true;
  var score = 0,
      topLevelAdDomainScore = 4,
      spammyURLScore = 8,
      sureThingScore = 30,
      adDomainScore = 8,
      adSizedScore = 5,
      blackListScore = 4,
      adMinScore = 7,
      trackingPixelScore;

  if (ignoreTrackingPixel) {
    trackingPixelScore = -500;
  } else {
    trackingPixelScore = 5;
  }

  var adTopLevelDomain = isTopLevelAdDomain(adObj);
  if (adTopLevelDomain) {
    debugLog("adTopLevelDomain: " + adObj.src);
    score += topLevelAdDomainScore;
  }

  var spammyURL = isURLSpam(adObj);
  if (spammyURL) {
    debugLog("spammyURL: " + adObj.src);
    score += spammyURLScore;
  }

  var sureThing = isSureThing(adObj);
  if (sureThing) {
    debugLog("sureThing: " + adObj.src);
    score += sureThingScore;
  }

  var adDomain = isAdDomain(adObj);
  if (adDomain) {
    debugLog("adDomain: " + adObj.src);
    score += adDomainScore;
  }

  var adSized = isAdSize(adObj);
  if (adSized) {
    score += adSizedScore;
    debugLog("adSized: " + adObj.src);
  }

  var trackingPixel = isTrackingPixel(adObj);
  if (trackingPixel) {
    score += trackingPixelScore;
  }

  var elementName = isElementNamedAd(adObj);
  var blackList = isBlackListDomain(adObj);
  if (blackList) {
    debugLog("blackList: " + adObj.src);
    score += blackListScore;
  }

  return score > adMinScore;
}

function logAd(adObj) {
  console.log(JSON.stringify(adObj));

  var ad_data = {
    type: "logAd",
    src: adObj.src,
    url: adObj.url,
    title: adObj.title,
    anchor: adObj.anchor,
    node_id: adObj.id,
    tag_type: adObj.tagType,
    width: adObj.width,
    height: adObj.height,
    inner_html: "",
    plugin_used: "adwiser",
    exp: "test_experiment"
  };

  chrome.runtime.sendMessage( ad_data, function(){});
}

function processAds(potentialAds) {
  var adObjs = [];
  for (var i = 0 ; i < potentialAds.length; i++) {
    var adObj = getAdObject(potentialAds[i]);
    adObjs.push(adObj);
    debugLog("Potential Ad: " + adObj);
    if (isAd(adObj)) {
      console.log("===> Found Ad: " + adObj.src);
      logAd(adObj);
    }
  }
}

function collectAds() {
  var potentialAds = [];
  $('iframe').each(function(index) {
    try{
      if (!isHttps()) {
        debugLog("Handling iframe: " + window.self.location.href);
        var contents = $(this).contents();
        var imgs  = contents[0].getElementsByTagName('img');
        for (var i = 0; i < imgs.length; i++) {
          var img_src = $(imgs[i]).attr('src');
          debugLog("Found img: " + $(imgs[i]).attr('src'));
          potentialAds.push(imgs[i]);
        }
      }
    } catch (err) {
      // TODO: Handle this later - likely violating single origin.
    }
  });

  $('img').each(function(index) {
    debugLog("Handling img: " + $(this).attr('src'));
    potentialAds.push(this);
  });
 
  processAds(potentialAds);
}
