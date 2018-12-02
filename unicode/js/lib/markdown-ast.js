// From https://github.com/aleclarson/markdown-ast/blob/master/index.js
// The original was run through Babel to make it es5

var returnTrue = function returnTrue() {
  return true;
};

// Returns true when the given string ends with an unescaped escape.
var isEscaped = function isEscaped(str) {
  var ESCAPE = '\\'.charCodeAt(0),
      i = str.length,
      n = 0;
  while (i && str.charCodeAt(--i) === ESCAPE) {
    n++;
  }return n % 2 == 1;
};

// Escape-aware string search.
var search = function search(input, target, cursor) {
  var i = cursor - 1;
  while (true) {
    var start = i;
    i = input.indexOf(target, i + 1);
    if (i < 0) return -1;
    if (!isEscaped(input.slice(start, i))) return i;
  }
};

/** Convert markdown into a syntax tree */
var parse = function parse(input) {
  var top = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  // Stack of unclosed nodes
  var blocks = [];
  // The last added node
  var prevNode = void 0;

  // Add text to the previous node if possible.
  // Otherwise, create a new text node and pass it to `addNode`.
  var addText = function addText(text) {
    return prevNode && prevNode.type == 'text' ? (prevNode.text += text, prevNode) : addNode({ type: 'text', text: text });
  };

  // Add a node to the current block.
  var addNode = function addNode(node) {
    var block = blocks.length ? blocks[blocks.length - 1].block : top;
    if (block) {
      block.push(node);
      return prevNode = node;
    }
  };

  var addBlock = function addBlock(node) {
    // Ensure links are closed properly.
    if (node.type == 'link') node = { type: 'link', block: node.block, url: '', ref: '' };
    return addNode(node);
  };

  // Gracefully close any unclosed nodes (as long as `filter` returns truthy).
  var flush = function flush() {
    var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : returnTrue;

    for (var i = blocks.length; --i >= 0;) {
      var node = blocks[i];
      if (!filter(node)) return node;
      addBlock(blocks.pop());
    }
  };

  // Move the cursor and update the lexer.
  var moveTo = function moveTo(offset) {
    return lexer.lastIndex = cursor = offset;
  };

  // The primary token scanner
  var lexer = /(^([*_-])\s*\2(?:\s*\2)+$)|(?:^(\s*)([>*+-]|\d+[.\)])\s+)|(?:^``` *(\w*)\n([\s\S]*?)\n```$)|(^(?:\t|    ))|(\!?\[)|(\](?:(\(|\[)|\:\s*(.+)$)?)|(?:^([^\s].*)\n(\-{3,}|={3,})$)|(?:^(#{1,6})(?:[ \t]+(.*))?$)|(?:`([^`].*?)`)|(  \n|\n\n)|(__|\*\*|[_*]|~~)/gm;
  var cursor = 0;
  while (true) {
    var match = lexer.exec(input),
        matchOffset = match ? match.index : input.length;

    // Copy text between this match and the last.
    var text = input.slice(cursor, matchOffset);

    // Trim singular line breaks, except the EOF newline.
    if (match || !/^\r?\n$/.test(text)) text = text.replace(match ? /(^\r?\n|\r?\n$)/g : /^\r?\n/g, '');

    // Move the cursor _after_ this match.
    if (match) cursor = lexer.lastIndex;

    // Create a text node.
    if (text) {
      addText(text);

      // Skip escaped matches.
      if (match && isEscaped(text)) {
        moveTo(match.index + 1);
        addText(match[0][0]);
        continue;
      }
    }

    if (!match) break;
    var i = 1;

    // Borders (-0 to +1)
    if (match[i]) {
      flush();
      addNode({
        type: 'border',
        text: input.slice(matchOffset, matchOffset + match[0].length)
      });
    }

    // Quotes and lists (-1 to +0)
    else if (match[i += 3]) {
        flush();

        var bullet = match[i];
        var isQuote = bullet == '>';
        var node = isQuote ? addNode({
          type: 'quote',
          block: []
        }) : addNode({
          type: 'list',
          block: [],
          indent: match[i - 1],
          bullet: bullet
        });

        // This looks for block-closing lines.
        var breakRE = isQuote ? /^\s{0,3}([*+-]|\d+[.\)])[ \t]/ : /^\s*([>*+-]|\d+[.\)])[ \t]/;

        // Find where the first line ends.
        var start = cursor;
        cursor = search(input, '\n', start);
        if (cursor < 0) cursor = input.length;

        // Parse multi-line blocks.
        var content = input.slice(start, cursor);
        while (cursor < input.length) {
          var _start = cursor + 1;
          // Look for "\n\n" break node.
          if (input.charAt(_start) == '\n') break;

          // Find where the current line ends.
          cursor = search(input, '\n', _start);
          if (cursor < 0) cursor = input.length;

          // Slice after "> " and before "\n"
          var line = input.slice(_start, cursor);

          // Avoid swallowing EOF newline.
          if (!line) {
            cursor = _start - 1;
            break;
          }

          // When a line starts with a list/quote node, avoid parsing it here.
          if (line.match(breakRE)) {
            cursor = _start;
            break;
          }

          content += '\n' + line.match(isQuote ? /^\s*>?\s*(.*)$/ : /^\s*(.*)$/)[1];
        }

        parse(content, node.block);
        moveTo(cursor);
      }

      // Code blocks: (-1 to +1)
      else if (match[i += 2] || match[i + 1]) {
          flush();

          var code = match[i];
          if (!code) {
            // Find where the current line ends.
            var _start2 = cursor;
            cursor = search(input, '\n', _start2);
            moveTo(cursor < 0 ? input.length : cursor);

            // Merge indented code together.
            code = input.slice(_start2, cursor);
            if (prevNode && prevNode.type == 'codeBlock' && prevNode.indent) {
              prevNode.code += '\n' + code;
              continue;
            }
          }
          addNode({
            type: 'codeBlock',
            code: code,
            syntax: match[i] ? match[i - 1].toLowerCase() : '',
            indent: match[i + 1] || ''
          });
        }

        // Images / Links (-0 to +0)
        else if (match[i += 2]) {
            if (match[i][0] == '!') {
              // Find the closing bracket.
              var endOffset = search(input, ']', cursor);
              if (endOffset < 0) {
                addText(match[0]);
                continue;
              }

              // Images are _not_ actually blocks. We treat it as one temporarily so
              // we can reuse code between images and links.
              prevNode = null;
              blocks.push({
                type: 'image',
                alt: input.slice(match.index + 2, endOffset),
                url: '',
                ref: ''
              });

              // Process the "]" next.
              moveTo(endOffset);
            }
            // Create a link node.
            else {
                prevNode = null;
                blocks.push({
                  type: 'link',
                  block: [],
                  offset: cursor
                });
              }
          }
          // Closing bracket (-0 to +2)
          else if (match[++i]) {
              var _ret = function () {
                var nodeTypes = /^(link|image)$/;
                var node = flush(function (block) {
                  return !nodeTypes.test(block.type);
                });
                if (node) {
                  blocks.pop();

                  // [foo]: bar
                  if (match[i + 2]) {
                    if (node.type == 'link') {
                      addNode({
                        type: 'linkDef',
                        key: input.slice(node.offset, matchOffset),
                        url: match[i + 2]
                      });
                      return 'continue';
                    }
                    moveTo(match.index + 1); // "]".length
                  }

                  node = addBlock(node);

                  // [foo](bar) or [foo][bar]
                  if (match[i + 1]) {
                    // Find the closing bracket.
                    var _endOffset = search(input, match[i + 1] == '(' ? ')' : ']', cursor);
                    if (_endOffset < 0) {
                      addText(match[i + 1]);
                    } else {
                      var startOffset = match.index + 2; // "](".length
                      var target = input.slice(startOffset, _endOffset);
                      moveTo(_endOffset + 1); // ")".length

                      // [foo](bar)
                      if (match[i + 1] == '(') {
                        node.url = target;
                      }
                      // [foo][bar]
                      else {
                          node.ref = target;
                        }
                    }
                  }
                } else {
                  addText(match[0]);
                }
              }();

              if (_ret === 'continue') continue;
            }

            // Titles (-0 to +3)
            else if (match[i += 3] || match[i + 2]) {
                flush();
                addNode({
                  type: 'title',
                  block: parse(match[i] || match[i + 3] || ''),
                  rank: match[i + 2] ? match[i + 2].length : match[i + 1][0] == '=' ? 1 : 2
                });
              }

              // Code spans (-0 to +0)
              else if (match[i += 4]) {
                  var codeOffset = matchOffset + 1;
                  addNode({
                    type: 'codeSpan',
                    code: input.slice(codeOffset, codeOffset + match[i].length)
                  });
                }

                // Breaks (-0 to +0)
                else if (match[++i]) {
                    flush();
                    addNode({ type: 'break', text: match[0] });
                  }

                  // Inline formatting (-0 to +0)
                  else if (match[++i]) {
                      var style = match[i];
                      var type = style.length < 2 ? 'italic' : style == '~~' ? 'strike' : 'bold';

                      // Close a matching block..
                      var _node = blocks[blocks.length - 1];
                      if (_node && _node.type == type && _node.style == style) {
                        addNode(blocks.pop());
                      }
                      // ..or open a new block.
                      else {
                          prevNode = null;
                          blocks.push({
                            type: type,
                            block: [],
                            style: style
                          });
                        }
                    }
  }

  flush();
  return top;
};

Object.defineProperty(parse, 'default', { value: parse });
module.exports = parse;

// to make it work in the browser
window.parse = parse;
