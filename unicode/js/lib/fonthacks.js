// From https://github.com/unixpickle/fonthacks/

(function() {

  // Character information:
  // Prefix char code: 55349
  // A-Za-z (bold): 56788 - 56839
  // A-Za-z (italics): 56840 - 56891
  // A-Za-z (bold+italics): 56892 - 56943

  var PREFIX_CODE = 55349;

  var FIRST_BOLD = 56788;
  var LAST_BOLD = FIRST_BOLD + 26*2;
  var FIRST_ITALIC = 56840;
  var LAST_ITALIC = FIRST_ITALIC + 26*2;
  var FIRST_BOLD_ITALIC = 56892;
  var LAST_BOLD_ITALIC = FIRST_BOLD_ITALIC + 26*2;

  var FIRST_SPECIAL = FIRST_BOLD;
  var LAST_SPECIAL = LAST_BOLD_ITALIC;

  function removeFormatting(ch) {
    var res = '';
    for (var i = 0, len = ch.length; i < len; ++i) {
      var code = ch.charCodeAt(i);
      if (code === PREFIX_CODE && i+1 < ch.length) {
        var next = ch.charCodeAt(i + 1);
        if (next >= FIRST_SPECIAL && next <= LAST_SPECIAL) {
          var specialIdx = next - FIRST_SPECIAL;
          var letterIndex = specialIdx % 26;
          var capital = (specialIdx % (26*2)) < 26;
          if (capital) {
            res += String.fromCharCode('A'.charCodeAt(0) + letterIndex);
          } else {
            res += String.fromCharCode('a'.charCodeAt(0) + letterIndex);
          }
          ++i;
          continue;
        }
      }
      res += ch[i];
    }
    return res;
  }

  function toggleBold(ch) {
    return toggle(ch, FIRST_BOLD, LAST_BOLD, FIRST_ITALIC, LAST_ITALIC);
  }

  function toggleItalic(ch) {
    return toggle(ch, FIRST_ITALIC, LAST_ITALIC, FIRST_BOLD, LAST_BOLD);
  }

  function toggle(ch, typeStart, typeEnd, otherStart, otherEnd) {
    var res = '';
    for (var i = 0, len = ch.length; i < len; ++i) {
      var code = ch.charCodeAt(i);
      if (code === PREFIX_CODE && i+1 < ch.length) {
        var next = ch.charCodeAt(i+1);
        if (next >= typeStart && next <= typeEnd) {
          res += removeFormatting(String.fromCharCode(code, next));
          ++i;
          continue;
        } else if (next >= otherStart && next <= otherEnd) {
          next += FIRST_BOLD_ITALIC - otherStart;
        } else if (next >= FIRST_BOLD_ITALIC && next <= LAST_BOLD_ITALIC) {
          next += otherStart - FIRST_BOLD_ITALIC;
        }
        res += String.fromCharCode(code, next);
        ++i;
        continue;
      } else if (code >= 'a'.charCodeAt(0) && code <= 'z'.charCodeAt(0)) {
        var letterIdx = code - 'a'.charCodeAt(0);
        res += String.fromCharCode(PREFIX_CODE, typeStart+26+letterIdx);
      } else if (code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0)) {
        var letterIdx = code - 'A'.charCodeAt(0);
        res += String.fromCharCode(PREFIX_CODE, typeStart+letterIdx);
      } else {
        res += String.fromCharCode(code);
      }
    }
    return res;
  }

  if ('undefined' === typeof window.fonthacks) {
    window.fonthacks = {};
  }
  window.fonthacks.removeFormatting = removeFormatting;
  window.fonthacks.toggleBold = toggleBold;
  window.fonthacks.toggleItalic = toggleItalic;

})();
