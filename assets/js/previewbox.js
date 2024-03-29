/*******************************************************************************************
 * Previewbox
 *
 * Copyright (C) 2013 Fischer Liu | MIT license | https://github.com/Fischer-L/previewbox
 *
 * Modified by Dillon Matchett for bombasticGames RPGs
 *******************************************************************************************/
var previewbox = (function () {
  "use strict";
  /*	Properties:
		[ Private ]
		<OBJ> _dbg = one debug control
		<OBJ> _CONST = an obj holding the constants
		<OBJ> _settings = an obj holding the settins on the preview box. The preview box would work based on these settings dyamically.
		<ELM> _previewbox = the preview box HTML element
	Methods:
		[ Private ]
		> _getIEVersion : Get the IE version
		> _normalizeEvent : Cope with the cross browser compatibility on the event object 
		> _addEvent : Do the same thing as addEventListener and mitigate the IE8 compatibility
		> _rmEvent : Do the same thing as removeEventListener and mitigate the IE8 compatibility
		> _isMouseOut : Check if the mouse is on the previewbox or the anchor <a> element or not
		> _isHref : Check for the valid href value
		> _getAppropriateMode : Get the mode appropriate for the current user scenario
		> _getDocScroll : Get the document's scrolling info
		> _getWindowSize : Get the client window width and height
		> _getIFrameSizePC : Get the iframe width and height for the PC mode's use
		> _getPreviewBoxSizePC : Get the preview box total width and height(including the border and padding)  for the PC mode's use
		> _getMobileBarTargetLinkTitle : Get the title for the mobile bar's target link' title
		> _setStyle : Set up the preview box style for both the PC and mobile mdoe
		> _setStylePC : Set up the preview box style for showing up for the PC mode
		> _setStyleMobile : Set up the preview box style for showing up for the mobile mode
		> _showBox : Show the preview box for both the PC and mobile mdoe
		> _showBoxPC : Show the preview box for the PC mode
		> _showBoxMobile : Show the preview box for the mobile mode
		> _hideBox : Hide the preview box for both the PC and mobile mdoe
		> _hideBoxPC : Hide the preview box for the PC mode
		> _hideBoxMobile : Hide the preview box for the mobile mode
		> _mkPrviewBox : Make one preview box
		> _mkPreviewAnchor : Make one preview anchor
		> _prepPreview : Prepare(Initial) the preview box
		[ Public ]
		> setSandbox : Set the value of the sandbox on the preview iframe. This will overwrite the original value.
		> config : To config the preview box
		> changeStyles : To change the preview box's style
		> regisAnchor : To convert one <a> element into the preview anchor and register it so the preview happens when moving mouse on the <a>
		> regisBySearching : To search all the <a> elements with the CSS class, "previewbox-anchor", in the docuemnt and register the findings
		> isDBG : Just for debugging & testing purpose
*/

  var /*	Methods:
				[ Public ]
				> isDBG : Tell if under the debug mode
				> warn : Log warnign to console
				> error : Log error to console
				> formaStr : Format string. Fox example, formaStr("{0} can {1}.", "Bird", "fly") returns "Bird can fly"
		*/
    _dbg = (function () {
      return {
        /*	Return:
						@ Under the debug mode: true
						@ Not Under the debug mode: false
				*/
        isDBG: function () {
          return false;
        },
        /*	Arg:
						<STR> msg = the warning message
				*/
        warn: function (msg) {
          console.warn("previewbox warn : " + msg);
        },
        /*	Arg:
						<STR> error = the error message
				*/
        error: function (msg) {
          console.error("previewbox error : " + msg);
        },
        /*	Arg:
						<STR> The 1st arg is the base string to format
						<STR|NUM> The rest of args are values supplied into the base string
					Return:
						<STR> The formatted string
				*/
        formaStr: function () {
          // From : http://jsfiddle.net/joquery/9KYaQ/
          var theString = arguments[0];

          for (var i = 1; i < arguments.length; i++) {
            var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
            theString = theString.replace(regEx, arguments[i]);
          }

          return theString;
        },
      };
    })(),
    _CONST = (function (c) {
      c.modeMobileW = 768; // in px. The width used to seperate the PC & mobile mode

      c.modePC = "modePC"; // Represent the PC mode
      c.modeMobile = "modeMobile"; // Represent the mobile mode

      c.nodeTypeELM = 1; // Element node type

      c.nodeTypeText = 3; // Text node type

      c.validProtocols = ["//", "http://", "https://"];

      c.boxID = "previewbox";
      c.anchorClass = "previewbox-anchor";

      c.fallbackWindowW = 1024; // in px
      c.fallbackWindowH = 768; // in px.

      c.boxFontSize = 16; // in px
      c.boxHiddenPosTop = "-10000px";
      c.boxHiddenPosLeft = "-10000px";

      // For the PC mode
      c.boxBorderW = 4; // in px
      c.iframeMaxPercW = 0.45; // The max proportion of the iframe's width could occuppy the window width
      c.iframeMinPercW = 0.45 * 0.6;
      c.iframeMaxPercH = 0.7; // The max proportion of the iframe's height could occuppy the window height
      c.iframeMinPercH = 0.7 * 0.6;
      c.windowPadding = 15; // in px; The min space between the preview box and the window top/bottom
      c.box2PtrPadding = 15; // in px; The min space between the preview box's pointer and the preview box top/bottom
      c.ptrBorderTopW = 5; // in px
      c.ptrBorderLeftW = 16; // in px

      // For the mobile mode
      c.mobileBoxBorderW = 6; // in px
      c.mobileBoxFontSize = c.boxFontSize * 0.9;
      c.mobileBarH = c.mobileBoxFontSize * 4;
      c.mobileTransitionSec = 0.5; // in sec; The transition duration

      return c;
    })({}),
    /*	Properties:
				[ Private ]
				<OBJ> __commonTypeChker = the collection of common implemntations of this::__inf_TypeChker
				<OBJ> __value  = the setting values' collection
				<OBJ> __aliasDeprecated = the alias map between the deprecated keys to the current keys
				<INF> __inf_TypeChker = the data type checker for setting's value
						Arg:
							<*> v = the value being checked against with.
						Return:
							@ OK: true
							@ NG: false
			Methods:
				[ Public ]
				> get : Get one setting value
				> set : Set one setting value
		*/
    _settings = (function (s) {
      var __commonTypeChker = {
          isNUM: function (v) {
            return typeof v == "number" && !isNaN(v);
          },
          isPositiveNUM: function (v) {
            return typeof v == "number" && v >= 0;
          },
          isSTR: function (v) {
            return typeof v == "string";
          },
          isNonEmptySTR: function (v) {
            return __commonTypeChker.isSTR(v) && v;
          },
          isBOOL: function (v) {
            return v === true || v === false;
          },
        },
        /*	Properties:
					[ Public ]
					> Each property stores one setting.
					  Property name is the key to setting.
					  Property value is one array which:
						- The 1st element is the setting value
						- The 2nd element is the type checking function which shall implement this::__inf_TypeChker
			*/
        __value = {
          // -- Config settings -- //

          // <BOO> If true, always go for the mobile mode disregarding any conditions.
          alwaysMobileMode: [false, __commonTypeChker.isBOOL],

          // <BOO> If true, no effects would take place in the mobile mode. You may need this for a better performance on mobile device.
          noEffectsInMobile: [true, __commonTypeChker.isBOOL],

          // !-- Config settings -- //

          // -- Style settings -- //

          // <NUM> The padding of the preview box in px
          "#previewbox/padding": [0, __commonTypeChker.isNUM],
          // <STR> The preview box's box-shadow CSS value
          "#previewbox/box-shadow": ["", __commonTypeChker.isSTR],
          // <STR> The CSS color of the preview box' border
          "#previewbox/border-color": ["#555", __commonTypeChker.isNonEmptySTR],
          // <STR> The backgournd image(in valid CSS) used when loading
          "#previewbox/background-image": ["", __commonTypeChker.isSTR],

          // <STR> The inner text value of the #previewbox-hintxt
          "#previewbox-hintxt/value": ["", __commonTypeChker.isSTR],

          // -- For the PC mode -- //

          // <NUM> In px. The iframe wish width. The real size doesn't necessarily obey this value but will dynamically be computed based this wish value.
          "#previewbox-iframe/width": [
            _CONST.fallbackWindowW * _CONST.iframeMaxPercW,
            __commonTypeChker.isPositiveNUM,
          ],
          // <NUM> in px. The iframe wish height
          "#previewbox-iframe/height": [
            _CONST.fallbackWindowH * _CONST.iframeMaxPercH,
            __commonTypeChker.isPositiveNUM,
          ],

          // -- For the mobile mode -- //

          // <STR> The CSS color of the mobileBar. This is going to decide the font and the button color on the mobileBar.
          "#previewbox-mobileBar/color": [
            "#edeeef",
            __commonTypeChker.isNonEmptySTR,
          ],

          // !-- Style settings -- //

          "just for ending": undefined,
        },
        __aliasDeprecated = {
          boxPadding: "#previewbox/padding",
          boxShadow: "#previewbox/box-shadow",
          loadingImg: "#previewbox/background-image",
          boxBorderColor: "#previewbox/border-color",

          iframeW: "#previewbox-iframe/width",
          iframeH: "#previewbox-iframe/height",

          mobileBarColor: "#previewbox-mobileBar/color",

          "just for ending": undefined,
        };

      /*	Arg:
					<STR> key = the key to setting's value
				Return:
					@ OK: <*> the appropriate setting's value
					@ NG: null
			*/
      s.get = function (key) {
        if (__aliasDeprecated[key] !== undefined) {
          _dbg.warn(
            _dbg.formaStr(
              "Use the deprecated setting key <{0}>. Use <{1}> instead",
              key,
              __aliasDeprecated[key]
            )
          );

          key = __aliasDeprecated[key];
        }

        if (__value[key] !== undefined) {
          return __value[key][0];
        } else {
          _dbg.error(
            _dbg.formaStr("Getting unknown setting with key <{0}>", key)
          );

          return null;
        }
      };

      /*	Arg:
					<STR> key = the key of setting
					<*> value = the value to set
				Return:
					@ OK: <*> the new value
					@ NG: undefined
			*/
      s.set = function (key, value) {
        if (__aliasDeprecated[key] !== undefined) {
          _dbg.warn(
            _dbg.formaStr(
              "Use the deprecated setting key <{0}>. Use <{1}> instead",
              key,
              __aliasDeprecated[key]
            )
          );

          key = __aliasDeprecated[key];
        }

        if (__value[key] !== undefined) {
          if (__value[key][1](value)) {
            __value[key][0] = value;

            return value;
          } else {
            _dbg.warn(
              _dbg.formaStr(
                "Setting <{0}> with invalid value <{1}>",
                key,
                value
              )
            );
          }
        } else {
          _dbg.warn(
            _dbg.formaStr("Setting unknown setting with key <{0}>", key)
          );
        }

        return undefined;
      };

      return s;
    })({}),
    /*	Properties:
				[ Public ]
				<ELM> The child DOM elements, refer to this::_mkPrviewBox
			Note:
				The _previewbox obj would be made during the intialization stage. Here just temporarily use null.
		*/
    _previewbox = null,
    /*	Return:
				@ Is IE: <NUM> the version of IE
				@ Not IE: NaN
		*/
    _getIEVersion = function () {
      var rv = -1; // Return value assumes failure.
      if (navigator.appName == "Microsoft Internet Explorer") {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
        if (re.exec(ua) != null) rv = +RegExp.$1;
      }
      return rv === -1 ? NaN : rv;
    },
    /*	Arg: 
				> e = the event object
			Return:
				> The normalized event
		*/
    _normalizeEvent = function (e) {
      // Cope with the cross browser compatibility

      if (!e) e = window.event;

      if (!e.target) e.target = e.srcElement || document;

      if (!e.preventDefault) {
        e.preventDefault = function () {
          e.returnValue = false; // Support IE

          e.defaultPrevented = true;

          return false; // Mimic the legacy approach
        };

        e.defaultPrevented = false;
      }

      return e;
    },
    /*	Arg:
				> elem = the element to which the event is added
				> evt = The event string excluding "on"
				> eHandle = the event handle
		*/
    _addEvent = function (elem, evt, eHandle) {
      if (elem.addEventListener) {
        elem.addEventListener(evt, eHandle);
      } else if (elem.attachEvent) {
        // The IE 8 case
        elem.attachEvent("on" + evt, eHandle);
      }
    },
    /*	Arg:
				> elem = the element to which the event is added
				> evt = The event string excluding "on"
				> eHandle = the event handle
		*/
    _rmEvent = function (elem, evt, eHandle) {
      if (elem.removeEventListener) {
        elem.removeEventListener(evt, eHandle);
      } else if (elem.detachEvent) {
        // The IE 8 case
        elem.detachEvent("on" + evt, eHandle);
      }
    },
    /*	Arg:
				> leaveFor = the toElement or e.relatedTarget of the onmouseout event, meaning the element for which the mouse leaves
				> anchor = the <a> element which is the current preview target
			Return:
				@ The mouse is still on the previewbox or the anchor <a> element: false
				@ The mouse is not on the previewbox or the anchor <a> element: true
		*/
    _isMouseOut = function (leaveFor, anchor) {
      var isOut = true,
        maxDepth = 3,
        depth = arguments[2] || 0;

      if (leaveFor) {
        isOut = !(
          leaveFor === _previewbox ||
          (typeof anchor == "object" && leaveFor === anchor)
        );
        if (depth < maxDepth && isOut) {
          depth++;
          leaveFor = leaveFor.parentNode;
          if (leaveFor) {
            return _isMouseOut(leaveFor, anchor, depth);
          }
        }
      }

      return isOut;
    },
    /*	Arg:
				> href = the href to check
			Return:
				@ OK: true
				@ NG: false
		*/
    _isHref = function (href) {
      var is = false;
      if (href && typeof href == "string") {
        href = href.toLowerCase();
        for (var i = 0; i < _CONST.validProtocols.length; i++) {
          if (href.indexOf(_CONST.validProtocols[i]) == 0) {
            is = true;
            break;
          }
        }
      }
      return is;
    },
    /*	Return:
				> _CONST.modePC or _CONST.modeMobile
		*/
    _getAppropriateMode = function () {
      if (_settings.get("alwaysMobileMode")) return _CONST.modeMobile;

      // Judge by the userAgent string
      var ua = window.navigator.userAgent.toLowerCase();
      if (ua.search(/mobile|windows phone/) >= 0) return _CONST.modeMobile;

      // Bye the legacy IEs
      if (_getIEVersion() <= 9) return _CONST.modePC;

      // Judge by the window width
      return _getWindowSize().windowWidth > _CONST.modeMobileW
        ? _CONST.modePC
        : _CONST.modeMobile;
    },
    /*	Retunr:
				<OBJ> {
					<NUM> top, left: the document's scrolling top/left info
				}
		*/
    _getDocScroll = function () {
      var top = 0,
        left = 0;

      if (document.documentElement && document.documentElement.scrollTop) {
        top = document.documentElement.scrollTop;
        left = document.documentElement.scrollLeft;
      } else if (document.body) {
        top = document.body.scrollTop;
        left = document.body.scrollLeft;
      }

      return { top: top, left: left };
    },
    /*	Return: {
				windowWidth : the width of the client window in px. If unable to find, then -1.
				windowHeight : the height of the client window in px. If unable to find, then -1.
			}
		*/
    _getWindowSize = function () {
      if (window.innerWidth) {
        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        };
      } else if (document.documentElement.offsetHeight) {
        return {
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight,
        };
      } else if (document.body.offsetHeight) {
        return {
          windowWidth: document.body.offsetWidth,
          windowHeight: document.body.offsetHeight,
        };
      } else if (document.documentElement.clientHeight) {
        return {
          windowWidth: document.documentElement.clientWidth,
          windowHeight: document.documentElement.clientHeight,
        };
      } else if (document.body.clientHeight) {
        return {
          windowWidth: document.body.clientWidth,
          windowHeight: document.body.clientHeight,
        };
      }

      return {
        windowWidth: -1,
        windowHeight: -1,
      };
    },
    /* Return : <OBJ> {
				iframeW, iframeH : <NUM> the iframe's width/height
		   }
		*/
    _getIFrameSizePC = function () {
      var c = _getWindowSize();

      if (c.windowWidth > 0 || c.windowHeight > 0) {
        var iframeW = _settings.get("#previewbox-iframe/width"),
          iframeH = _settings.get("#previewbox-iframe/height");

        c.iMaxW = c.windowWidth * _CONST.iframeMaxPercW;
        c.iMinW = c.windowWidth * _CONST.iframeMinPercW;
        c.iMaxH = c.windowHeight * _CONST.iframeMaxPercH;
        c.iMinH = c.windowHeight * _CONST.iframeMinPercH;

        c.iW =
          c.iMinW <= iframeW && iframeW <= c.iMaxW
            ? iframeW
            : c.iMinW > iframeW
            ? c.iMinW
            : c.iMaxW;

        c.iH =
          c.iMinH <= iframeH && iframeH <= c.iMaxH
            ? iframeH
            : c.iMinH > iframeH
            ? c.iMinH
            : c.iMaxH;
      } else {
        c.iW = _CONST.fallbackWindowW * _CONST.iframeMaxPercW;
        c.iH = _CONST.fallbackWindowH * _CONST.iframeMaxPercH;
      }

      return {
        iframeW: c.iW,
        iframeH: c.iH,
      };
    },
    /*	Return: {
				width : the total width of the preview box in px.
				height : the height of the preview box in px.
			}
		*/
    _getPreviewBoxSizePC = function () {
      var i = _getIFrameSizePC(),
        j = _CONST.boxBorderW * 2 + _settings.get("#previewbox/padding") * 2;

      return {
        width: i.iframeW + j,
        height: i.iframeH + j,
      };
    },
    /*	Arg:
				<ELM> root = the <a> element being the preview target
			Return:
				@ OK: <STR> the appropriate title extracted from the target <a>
				@ NG: null
		*/
    _getMobileBarTargetLinkTitle = function (root) {
      var title = "";

      try {
        // The traversing depth; Max is 3.
        var depth = typeof arguments[1] == "number" ? arguments[1] : 3;

        if (root.hasChildNodes() && depth > 0) {
          var i,
            v,
            ns = root.childNodes;

          for (i = 0; i < ns.length; ++i) {
            v = ns[i];

            switch (v.nodeType) {
              case _CONST.nodeTypeText:
                v = v.nodeValue.trim();

                if (v) title += v + " ";

                break;

              case _CONST.nodeTypeELM:
                var tags = [
                  // The elements into which we are willing to dig
                  "ariticle",
                  "b",
                  "bdi",
                  "bdo",
                  "blockquote",
                  "button",
                  "caption",
                  "cite",
                  "code",
                  "dd",
                  "del",
                  "dfn",
                  "div",
                  "di",
                  "dt",
                  "em",
                  "figcaption",
                  "figure",
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "h5",
                  "h6",
                  "i",
                  "ins",
                  "kbd",
                  "lable",
                  "legend",
                  "main",
                  "mark",
                  "p",
                  "pre",
                  "q",
                  "s",
                  "section",
                  "small",
                  "span",
                  "strong",
                  "sub",
                  "summary",
                  "sup",
                  "td",
                  "th",
                  "time",
                  "tr",
                  "u",
                  "var",
                ];

                if (tags.indexOf(v.tagName.toLowerCase()) >= 0) {
                  v = _getMobileBarTargetLinkTitle(v, depth - 1);

                  if (v) title += v;
                }

                break;
            }
          }
        }
      } catch (e) {
        _dbg.error("Error on _getMobileBarTargetLinkTitle --> " + e);
      }

      return title ? title : null;
    },
    /*
     */
    _setStyle = function () {
      // Let's reset styles

      _previewbox.style.color =
        _previewbox.style.borderColor =
        _previewbox.hintxt.style.color =
        _previewbox.iframe.style.borderColor =
        _previewbox.pointer.style.borderColor =
        _previewbox.mobileBar.style.backgroundColor =
          _settings.get("#previewbox/border-color");

      _previewbox.style.transition = "";
      _previewbox.style.position = "fixed";
      _previewbox.style.backgroundImage = _settings.get(
        "#previewbox/background-image"
      );

      _previewbox.hintxt.innerHTML = _settings.get("#previewbox-hintxt/value");

      _previewbox.carpet.style.display =
        _previewbox.pointer.style.display =
        _previewbox.mobileBar.style.display =
          "none";

      _previewbox.hintxt.style.left = _previewbox.hintxt.style.right = "";

      _previewbox.iframe.style.padding =
        _previewbox.iframe.style.borderBottomWidth = "0";
    },
    /*	Arg:
				<NUM> mousePosX = the horizontal coordinate (according to the client area) of the mouse pointer
				<NUM> mousePosY = the vertical coordinate (according to the client area) of the mouse pointer 
		*/
    _setStylePC = function (mousePosX, mousePosY) {
      var wSize = _getWindowSize(),
        ifSize = _getIFrameSizePC(),
        bSize = _getPreviewBoxSizePC();

      var v = {
        bTop: NaN,
        pTop: NaN,
        bW: bSize.width,
        bH: bSize.height,
        bBorderW: _CONST.boxBorderW,
        bPadding: _settings.get("#previewbox/padding"),
        ifW: ifSize.iframeW,
        ifH: ifSize.iframeH,
        fontSize: _CONST.boxFontSize,
        pWidth: 2 * _CONST.ptrBorderLeftW,
        pHozPos: -(2 * _CONST.ptrBorderLeftW + _CONST.boxBorderW - 1),
        pTopMin:
          _CONST.box2PtrPadding -
          _CONST.boxBorderW -
          _settings.get("#previewbox/padding"),
        winW:
          wSize.windowWidth > 0 ? wSize.windowWidth : _CONST.fallbackWindowW,
        winH:
          wSize.windowHeight > 0 ? wSize.windowHeight : _CONST.fallbackWindowH,
      };

      if (v.winH - mousePosY > v.bH) {
        // The room in the window bottom is enough for the whole box
        v.bTop = mousePosY - _CONST.windowPadding * 2;
      } else {
        v.bTop = v.winH - v.bH - _CONST.windowPadding;
      }

      v.pTop =
        mousePosY -
        v.bTop -
        _CONST.boxBorderW -
        _settings.get("#previewbox/padding") +
        _CONST.ptrBorderTopW;
      if (v.pTop < v.pTopMin) {
        // The preview box pointer's top value is less than the min limit
        v.pTop = _CONST.box2PtrPadding;
      } else if (v.pTop > v.bH - v.pTopMin) {
        // The preview box pointer's top value is more than the max limit
        v.pTop = v.bH - _CONST.box2PtrPadding;
      }

      if (_dbg.isDBG()) {
        for (var p in v) {
          if (v.hasOwnProperty(p)) {
            if (isNaN(v[p]) || typeof v[p] != "number")
              _dbg.error(
                "illegal value for setting PC mode style => " + p + " = " + v[p]
              );
          }
        }
      }

      _previewbox.style.width = _previewbox.style.height = "";
      _previewbox.style.top = v.bTop + "px";
      _previewbox.style.boxSize = "content-box";
      _previewbox.style.padding = v.bPadding + "px";
      _previewbox.style.borderWidth = v.bBorderW + "px";

      _previewbox.iframe.style.top = "0";
      _previewbox.iframe.style.width = v.ifW + "px";
      _previewbox.iframe.style.height = v.ifH + "px";

      _previewbox.carpet.style.width = v.bW + v.pWidth + "px";
      _previewbox.carpet.style.height = v.bH + v.pWidth + "px";

      _previewbox.hintxt.style.top = "0";
      _previewbox.hintxt.style.left = "4px";
      _previewbox.hintxt.style.fontSize = v.fontSize + "px";

      _previewbox.pointer.style.top = v.pTop + "px";

      _previewbox.carpet.style.display = _previewbox.pointer.style.display =
        "block";

      if (mousePosX < v.winW / 2) {
        // The mouse is at the left half side of the window
        _previewbox.style.left = mousePosX + v.pWidth / 2 + "px";
        _previewbox.pointer.style.left = v.pHozPos + "px";
        _previewbox.pointer.style.right = "";
        _previewbox.pointer.style.borderTopColor = "transparent";
        _previewbox.pointer.style.borderBottomColor = "transparent";
        _previewbox.pointer.style.borderLeftColor = "transparent";
      } else {
        // The mouse is at the right half side of the window
        _previewbox.style.left = mousePosX - v.bW - v.pWidth / 2 + "px";
        _previewbox.pointer.style.left = "";
        _previewbox.pointer.style.right = v.pHozPos + "px";
        _previewbox.pointer.style.borderTopColor = "transparent";
        _previewbox.pointer.style.borderBottomColor = "transparent";
        _previewbox.pointer.style.borderRightColor = "transparent";
      }

      var shadow = _settings.get("#previewbox/box-shadow");
      if (shadow && shadow !== _previewbox.style.boxShadow) {
        _previewbox.style.oBoxShadow =
          _previewbox.style.msBoxShadow =
          _previewbox.style.mozBoxShadow =
          _previewbox.style.webkitBoxShadow =
          _previewbox.style.boxShadow =
            shadow;
      }
    },
    /*	Arg:
				<ELM> previewAnchor = the <a> element currently being the preview target
		*/
    _setStyleMobile = function (previewAnchor) {
      var v = {
          hTop: _CONST.mobileBarH + 1, // plus 1 for some adjustment
          ifTop: _CONST.mobileBarH, // + 100, // plus 1 for some adjustment
          bPadding: _settings.get("#previewbox/padding") / 2,
          fontSize: _CONST.mobileBoxFontSize,
        },
        s = {
          aHref: previewAnchor.href,
          aTitle: _getMobileBarTargetLinkTitle(previewAnchor),
        };

      if (!s.aTitle) s.aTitle = s.aHref;

      if (_dbg.isDBG()) {
        for (var p in v) {
          if (v.hasOwnProperty(p)) {
            if (isNaN(v[p]) || typeof v[p] != "number") {
              _dbg.error(
                _dbg.formaStr(
                  "illegal value for setting mobile mode style --> {0} = {1}",
                  p,
                  v[p]
                )
              );
            }
          }
        }

        for (var p in s) {
          if (s.hasOwnProperty(p)) {
            if (!s[p] || typeof s[p] != "string") {
              _dbg.error(
                _dbg.formaStr(
                  "illegal value for setting mobile mode style --> {0} = {1}",
                  p,
                  s[p]
                )
              );
            }
          }
        }
      }

      _previewbox.style.top = _previewbox.style.left = "0";
      _previewbox.style.width = _previewbox.style.height = "100%";
      _previewbox.style.padding = "0";
      _previewbox.style.borderWidth = "0";
      _previewbox.style.boxSizing = "border-box";
      _previewbox.style.oBoxShadow =
        _previewbox.style.msBoxShadow =
        _previewbox.style.mozBoxShadow =
        _previewbox.style.webkitBoxShadow =
        _previewbox.style.boxShadow =
          "";

      _previewbox.hintxt.style.right = "6px";
      _previewbox.hintxt.style.top = v.hTop + "px";
      _previewbox.hintxt.style.fontSize = v.fontSize * 1.1 + "px";

      _previewbox.mobileBar.style.display = "block";
      _previewbox.mobileBar.targetLink.href = s.aHref;
      _previewbox.mobileBar.targetLink.innerHTML = s.aTitle;

      _previewbox.iframe.style.width = _previewbox.iframe.style.height = "100%";
      _previewbox.iframe.style.top = v.ifTop + "px";
      _previewbox.iframe.style.padding = v.bPadding + "px";
      _previewbox.iframe.style.borderBottomWidth =
        _CONST.mobileBoxBorderW + "px";
    },
    /*	Arg:
				<ELM> previewAnchor = the <a> element currently being the preview target
		*/
    _showBox = function (previewAnchor) {
      _previewbox.iframe.src = previewAnchor.href;
    },
    /*	Arg:
				<ELM> previewAnchor = the <a> element currently being the preview target
				> mousePosX, mousePosY = refer to this::_setStylePC
		*/
    _showBoxPC = function (previewAnchor, mousePosX, mousePosY) {
      _setStyle();
      _setStylePC(mousePosX, mousePosY);
      _showBox(previewAnchor);
    },
    /*
     */
    _hideBox = function () {
      _previewbox.iframe.src = "";
      _previewbox.style.display = "none";
      _previewbox.style.top = _CONST.boxHiddenPosTop;
      _previewbox.style.left = _CONST.boxHiddenPosLeft;
    },
    _hideBoxPC = _hideBox,
    /*
     */
    _hideBoxMobile = function () {
      // -- Hack for the scrolling issue -- //

      var scroll = _getDocScroll();

      window.scrollTo(
        scroll.left,
        _previewbox.getAttribute("data-origScrollTopInMobile")
      );

      // !-- Hack for the scrolling issue -- //

      if (!_settings.get("noEffectsInMobile")) {
        _previewbox.style.width = _previewbox.style.height = "0%";

        // Delay for the close transition
        setTimeout(function () {
          _hideBox();
        }, _CONST.mobileTransitionSec * 1000 - 70);
      } else {
        _hideBox();
      }
    },
    /*	Arg:
				<ELM> div = one <div> element to be converted into the preview box
			Return:
				Refer to this::_previewbox
		*/
    _mkPrviewBox = function (div) {
      _previewbox = div;

      div.id = _CONST.boxID;
      div.style.display = "none";
      // div.style.width = div.style.height = when at the mobile mode ? 100% : computed dynamically
      // div.style.transition =  when at the mobile mode ? transition on width & height : null
      // div.style.padding = when at the mobile mode ? 0: set dynamically
      // div.style.borderWidth = when at the mobile mode ? 0 : set dynamically
      div.style.borderStyle = "solid";
      // div.style.borderColor = set dynamically
      // div.style.borderTopWidth = when at the mobile mode ? 0 : borderWidth;
      // div.style.boxSize = when at the mobile mode ? border-box : content-box
      div.style.backgroundColor = "#fff";
      // div.style.backgroundImage = set dynamically
      div.style.backgroundPosition = "center center";
      div.style.backgroundRepeat = "no-repeat";
      div.style.overflow = "visible";
      div.style.position = "fixed";
      div.style.top = _CONST.boxHiddenPosTop; // when at the mobile mode ? 0 : set dynamically based on the mouse position
      div.style.left = _CONST.boxHiddenPosLeft; // when at the mobile mode ? 0 : set dynamically based on the mouse position
      div.style.zIndex = 9999999999999;
      div.innerHTML =
        '<div id="previewbox-carpet" style="position:absolute;' +
        "z-index:1;" +
        "top:" +
        -_CONST.ptrBorderLeftW +
        "px;" +
        "left:" +
        -_CONST.ptrBorderLeftW +
        "px;" +
        // width: the total width of the box + the total width of the #previewbox-pointer;
        // height: the total height of the box + the total width of the #previewbox-pointer;
        // display: when at the mobile mode ? none : block
        '"' +
        "></div>" +
        '<div id="previewbox-pointer" style="border-style: solid;' +
        "border-width: " +
        _CONST.ptrBorderTopW +
        "px " +
        _CONST.ptrBorderLeftW +
        "px;" +
        // border-color: set dynamically the same as the previewbox's border color
        "position: absolute;" +
        "z-index: 2;" +
        // top: set dynamically

        // When at the left of the box
        // border-left-color: transparent;
        // left: - (The total width of this + the left border of the box - 1);

        // When at the right of the box
        // border-right-color: transparent;
        // right: - (The total width of this + the right border of the box -1);

        // display: when at the mobile mode ? none : block
        '"' +
        "></div>" +
        '<h5 id="previewbox-hintxt"' +
        'style="padding: 2px 4px;' +
        "margin: 0;" +
        "background-color: #fff;" +
        "position: absolute;" +
        "z-index: 4;" +
        // top: when at the mobile mode ? the #previewbox-mobileBar height + some adjustments if necessary : 0
        // left: when at the mobile mode ? null : 6px
        // right: when at the mobile mode ? 6px : null
        // color: set dynamically the same as the previewbox's border color
        // font-size: set dynamically based on the mobile & PC mode
        '"' +
        ">" +
        _settings.get("#previewbox-hintxt/value") +
        "</h5>" +
        '<div id="previewbox-mobileBar"' +
        'style="width: 100%;' +
        "height:" +
        _CONST.mobileBarH +
        "px;" +
        "margin: 0;" +
        "line-height:" +
        _CONST.mobileBarH +
        "px;" +
        "font-size:" +
        _CONST.mobileBoxFontSize +
        "px;" +
        "color:" +
        _settings.get("#previewbox-mobileBar/color") +
        ";" +
        "position: absolute;" +
        "z-index: 4;" +
        "top: 0;" +
        "left: 0;" +
        // background-color: set dynamically the same as the previewbox's border color
        // display: when at the mobile mode ? block : none
        '"' +
        ">" +
        '<a id="previewbox-mobileBar-targetLink"' +
        'style="width: 66%;' +
        "margin-left:" +
        (_CONST.mobileBoxBorderW + 6) +
        "px;" +
        "display: inline-block;" +
        "overflow: hidden;" +
        "text-overflow: ellipsis;" +
        "white-space: nowrap;" +
        "color:" +
        _settings.get("#previewbox-mobileBar/color") +
        ";" +
        '"' +
        'href="#"' + // Set to the link being previewed
        ">" +
        // Set the inner value to the previewed link text
        "</a>" +
        '<div id="previewbox-mobileBar-closeBtn"' +
        'style="width: 52px;' +
        "height:" +
        _CONST.mobileBarH +
        "px;" +
        "float: right;" +
        "position: relative;" +
        '"' +
        ">" +
        '<div style="border-style: solid;' +
        "border-width: 1px " +
        _CONST.mobileBarH * 0.18 +
        "px;" +
        "border-radius: 2px;" +
        "position: absolute;" +
        "top: 50%;" +
        "left: 50%;" +
        "-webkit-transform: translateY(-50%) translateX(-50%) rotate(45deg);" +
        "transform: translateY(-50%) translateX(-50%) rotate(45deg);" +
        '"' +
        "></div>" +
        '<div style="border-style: solid;' +
        "border-width: 1px " +
        _CONST.mobileBarH * 0.18 +
        "px;" +
        "border-radius: 2px;" +
        "position: absolute;" +
        "top: 50%;" +
        "left: 50%;" +
        "-webkit-transform: translateY(-50%) translateX(-50%) rotate(-45deg);" +
        "transform: translateY(-50%) translateX(-50%) rotate(-45deg);" +
        '"' +
        "></div>" +
        "</div>" +
        "</div>" +
        '<iframe id="previewbox-iframe" frameborder="0" sandbox="allow-scripts"' +
        'style="box-sizing: border-box;' +
        // padding : when at the PC mode ? 0 : set to 50% in the PC mode dynamically
        "border-style: " +
        div.style.borderStyle +
        ";" +
        // border-color: set dynamically the same as in the PC
        "border-width: 0;" +
        // border-bottom-width: when at the PC mode ? 0 : set dynamically
        //                      Why we only draw the bottom border but not like a a border frame in the PC mode is
        //                      because the left border color gets stange in all mobile browsers
        "position: relative;" +
        "z-index: 3;" +
        // width/height: when at the mobile mode ? 100% : computed
        // top: when at the mobile mode ? the #previewbox-mobileBar height + some adjustments if necessary : 0
        '"' +
        "></iframe>";

      _previewbox.hintxt = _previewbox.querySelector("#previewbox-hintxt");
      _previewbox.carpet = _previewbox.querySelector("#previewbox-carpet");
      _previewbox.iframe = _previewbox.querySelector("#previewbox-iframe");
      _previewbox.pointer = _previewbox.querySelector("#previewbox-pointer");
      _previewbox.mobileBar = _previewbox.querySelector(
        "#previewbox-mobileBar"
      );
      _previewbox.mobileBar.targetLink = _previewbox.querySelector(
        "#previewbox-mobileBar-targetLink"
      );

      _addEvent(
        _previewbox.querySelector("#previewbox-mobileBar-closeBtn"),
        "click",
        function (e) {
          _hideBoxMobile();
        }
      );

      _addEvent(_previewbox.iframe, "load", function () {
        _previewbox.style.backgroundImage = "";
        this.contentWindow.postMessage("minify", "*");
      });

      return _previewbox;
    },
    /*	Arg:
				> a = one <a> element to be converted into the preview anchor
			Return:
				@ OK: <ELM> The preview anchor with some new features:
					* Properties:
						[ Private ]
						> _a_queued = a boolean flag to mark the queue state
						> _a_handlesOnmouseover = an array of the event handlers on the onmouseover event
						> _a_handlesOnmouseout = an array of the event handlers on the onmouseout event
						[ Public ]
						> anchorType = a number indicating the type of anchor, current only 0 is defined. We use this property to know whether one <a> element had been registered before and know its type (Maybe in the future we will have different featured anchors).
					* Methods:
						[ Private ]
						> _a_obeserveMouseOut : Call this method to obeserveif mouse is out when the preview box is opening
						> _a_openPreviewPC : The event listener listening for the event to preview link's content for the PC mode
						> _a_openPreviewMobile : The event listener listening for the event to preview link's content for the mobile mode
						> _a_closePreviewPC : The event listener listening for the event to stop previewing link's content for the PC mode				
				@ NG: <*> Just return what passed in
		*/
    _mkPreviewAnchor = function (a) {
      if (!(a.anchorType >= 0) || !(typeof a.anchorType == "number")) {
        let mouseOver = false;

		var _a_exitAnchor = function (e) {
			mouseOver = false;
            window.removeEventListener("keydown", _a_openPreviewPC);
          },
          _a_enterAnchor = function (e) {
			mouseOver = true;
            window.addEventListener("keydown", _a_openPreviewPC);
          },
          _a_openPreviewPC = function (e) {
            e = _normalizeEvent(e);

            if (_isHref(a.href)) {
              // only appear if holding ctrl
              switch (_getAppropriateMode()) {
                case _CONST.modePC:
                  if (e.key === "Control") {
                    // This is important. It prevents the preview box from being redrawn repeatedly while onmouseover
                    window.removeEventListener("keydown", _a_openPreviewPC);
                    window.addEventListener("keyup", _a_closePreviewPC);
                    var bounding = a.getBoundingClientRect();
                    _showBoxPC(a, bounding.right, bounding.bottom);
                  }

                  break;

                case _CONST.modeMobile:
                  // Don't want anything to happen with mobile
                  break;
              }
            }
          },
          _a_closePreviewPC = function (e) {
            e = _normalizeEvent(e);

            if (!e.ctrlKey) {
			  if(mouseOver) {
				window.addEventListener("keydown", _a_openPreviewPC);
			  }
              window.removeEventListener("keyup", _a_closePreviewPC);
              _hideBoxPC();
            }
          };

        a.anchorType = 0;

        _addEvent(a, "mouseover", _a_enterAnchor);
		_addEvent(a, "mouseout", _a_exitAnchor);
      }
      return a;
    },
    /*
     */
    _prepPreview = function () {
      // Append the preview box into the document if without one
      var box = document.querySelector("div#" + _CONST.boxID);
      if (!box) {
        _previewbox = _mkPrviewBox(document.createElement("DIV"));
        document.body.appendChild(_previewbox);
      } else {
        _previewbox = _mkPrviewBox(box);
      }

      // Search all the <a> elems with our special class and then register all the findings
      publicProps.regisBySearching();
    },
    publicProps = {
      /*	Arg:
					<STR> v = the sandbox value, refe to the HTML5 sandbox spec
				Return:
					<STR> The current sandbox value
			*/
      setSandbox: function (v) {
        if (typeof v == "string") {
          _previewbox.iframe.setAttribute("sandbox", v);
        }
        return _previewbox.iframe.getAttribute("sandbox");
      },
      /*	Arg:
					<OBJ> params = The config params.
								   Each property inside is one new config being set.
								   Property name is config setting name. Property value is value.
								   Refer to this::_settings for the configurable settings.
				Return:
					@ NG: null
					@ OK: <OBJ> one object carrying the changed config values.
					      For exemple, suppoe set the "alwaysMobileMode" as true and the "noEffectsInMobile" as true, when setting is done,
						  it will return {
							"alwaysMobileMode" : true,
							"noEffectsInMobile" : "true"
						  }
			*/
      config: function (params) {
        var newConfigs = null;

        if (params instanceof Object) {
          for (var prop in params) {
            if (params.hasOwnProperty(prop) && typeof prop != "function") {
              if (!(newConfigs instanceof Object)) newConfigs = {};

              newConfigs[prop] = _settings.set(prop, params[prop]);
            }
          }
        }

        return newConfigs;
      },
      /*	Arg:
					<OBJ> styles = The setable styles.
								   Each property inside is one new style being set.
								   Property name is style name. Property value is style value.
								   Refer to this::_settings for the setable styles.
				Return:
					@ NG: null
					@ OK: <OBJ> one object carrying the changed style values.
					      For exemple, suppoe set the "#previewbox/border-color" as #777 and the "#previewbox/padding" as 50, when setting is done,
						  it will return {
							"#previewbox/padding" : 50,
							"#previewbox/border-color" : "#777"
						  }
			*/
      changeStyles: function (styles) {
        // p.s:
        // Currently setting styles is thru setting configs.
        // However, maybe one day we would seperate them so use "config" to config and use "changeStyles" to change styles.
        return this.config(styles);
      },
      /*	Arg:
					> a = the <a> element to register
				Return:
					@ OK: the <a> element with an extra method called .
						  the method, 
					@ NG: null
			*/
      regisAnchor: function (a) {
        if (
          a &&
          typeof a == "object" &&
          a.nodeType === 1 &&
          a.tagName === "A"
        ) {
          var className = " " + a.className + " ",
            reg = new RegExp(" " + _CONST.anchorClass + " ");

          // If the <a> has no our special class, then add...
          if (!reg.test(className)) {
            a.className += " " + _CONST.anchorClass;
          }

          return _mkPreviewAnchor(a);
        }
        return null;
      },
      /*	Return:
					@ Find: the nodeList of the <a>s are registered and become the preview anchor
					@ Find nothing: null
			*/
      regisBySearching: function () {
        const container = document.querySelector("main");
        var i,
          as = container.querySelectorAll("a");
        for (i = 0; i < as.length; i++) {
          if (
            as[i].href.includes("aspirantrpg.com") ||
            as[i].href.includes("bombasticgames.com")
          ) {
            _mkPreviewAnchor(as[i]);
          }
        }
        return as.length > 0 ? as : null;
      },
      /*	Refer to this::_dbg.isDBG
       */
      isDBG: function () {
        return _dbg.isDBG();
      },
      rmSandbox: function () {
        // This is obsolete.
        // We discourage no setting sandbox so remove this method.
        _dbg.error(
          "Call the obsolete rmSandbox method. Never remove sandbox unless you very know what you are doing!"
        );
      },
    };

  window.addEventListener(
    "message",
    (e) => {
      if (e.data === "done") {
        _previewbox.style.display = "block";
      }
    },
    false
  );

  _prepPreview();

  return publicProps;
})();
