$(function(){
  // auto-translate the input every time the text area changes
  $('#transform-input-text').on('input', transformFromInput);

  $('#transform-demo-button').on('click', function(){
    var demoText = "I'm a demo. **These words are bold**, and _these are italic_. **_These are both!_** \n \n Here's a fun list: \n\n * Milk _(skim please)_ \n * Eggs \n * Cheese \n \n Try copying me into **Twitter** or **Facebook**!";

    // put it in the input field...
    $('#transform-input-text').val(demoText);

    // then run the input handler to make it seem like the text was pasted in
    transformFromInput();
  });



  // text experimentation tool: show bold, italic, or both versions automatically
  $('#experiment-input-text').on('input', experimentFromInput);

  $('#experiment-demo-button').on('click', function(){
    var demoText = "San Francisco, California";

    $('#experiment-input-text').val(demoText);

    experimentFromInput();
  })
});

/**
  Reads the input field and transforms the text in it.
*/
function transformFromInput() {
  var input = $('#transform-input-text').val();

  if (input) {
    var output = transform2(input);
    $('#transform-output-text').val(output);
  }
  else {
    $('#transform-output-text').val("");
  }
}

/**
  Shows bold and italic versions of text from the input field.
*/
function experimentFromInput() {
  var input = $('#experiment-input-text').val();

  if (input) {
    // make a new version of the input but bold, italic, and both (+ special ones)
    var bolded = fonthacks.toggleBold(input);
    var italicized = fonthacks.toggleItalic(input);
    var both = fonthacks.toggleBold(fonthacks.toggleItalic(input));
    // fancy "old english" type
    var fraktur = frakturTransform(input);

    var output = bolded + "\n=====\n" + italicized + "\n=====\n" + both + "\n=====\n" + fraktur;

    $('#experiment-output-text').val(output);
  }
  else {
    $('#experiment-output-text').val("");
  }
}

/**
  Given some raw input text, runs all the transformations and makes some nice
  output text.
*/
function transform2(rawInput) {
  // get a raw list of nodes from the AST algorithm
  let nodeList = markdownAST.parse(rawInput);
  console.log("NodeList", nodeList);

  // extract text from each node
  let nodeText = _.map(nodeList, textFromNode);

  // smoosh it all together
  return nodeText.join("");
}

function textFromNode(node) {
  if (node.block) {
    // `block` is another word for children
    // so if this node has children, recursively get text from all of them
    // then apply whatever this node's transformation is to them
    var childrenText = _.map(node.block, textFromNode);

    // apply formatting to all children; each transformation operates a little
    // differently so offer max flexibility
    switch(node.type) {
      case "bold":
        // take the array of child text, turn every element bold, then smoosh
        // it into a single string
        return _.map(childrenText, fonthacks.toggleBold).join("");
        break;
      case "italic":
        return _.map(childrenText, fonthacks.toggleItalic).join("");
        break;
      case "list":
        // this behaves a little differently
        // (this is a list item more than a list, tbh)
        // each element inside it should be rendered as normal; then the whole
        // thing put together should get a bullet in front and a newline afterward
        // the bullet depends on the inputted node.
        // if it's a `*`, use a nice bullet point. otherwise if it's a number
        // or something leave it alone
        var bullet;
        switch (node.bullet) {
          case "*": bullet = String.fromCharCode(8226); break; // a nice bullet point
          case "-": bullet = String.fromCharCode(8212); break; // emdash from a hyphen
          default: bullet = node.bullet; break;
        }

        return bullet + " " + childrenText.join("") + "\n";
        break;
      default:
        // fallback; treat this as the identity function
        return childrenText.join("")
        break;
    }
  }
  else {
    // this node has no children; it's a leaf!
    // so let's just return the raw text from it
    return node.text;
  }
}

/**
  Takes raw ASCII text and turns it into cool "Old English" fraktur font.
*/
function frakturTransform(text) {
  // so we need to take raw text (1 byte wide per character) and turn it into
  // fancy Fraktur ("Old English"/"Germanic") text (2 bytes wide each).
  // each of these letters' first bits is $PREFIX_CODE and the second is
  // between a certain range

  var PREFIX_CODE = 55349;
  // fraktur starts at A=566843 and goes A-Za-z so z=56735
  var FIRST_FRAKTUR = 56684; // this is A
  var LAST_FRAKTUR = 56735; // this is z

  // now convert the input text (in normal ASCII) to the fancy one,
  // letter by letter
  var transformedLetters = _.map(text.split(""), function(letter) {
    // ASCII is weird because it has 6 characters from [91, 96] between Z and a.

    var charCode_A = "A".charCodeAt(0);
    var charCode_Z = "Z".charCodeAt(0);
    var charCode_a = "a".charCodeAt(0);
    var charCode_z = "z".charCodeAt(0);

    var letterCharCode = letter.charCodeAt(0);

    if (letterCharCode >= charCode_A && letterCharCode <= charCode_Z) {
      // this is an uppercase letter
      // find offset from A...
      var offset = letterCharCode - charCode_A;
      // ...then apply it on top of the fraktur A
      var transformedIndex = FIRST_FRAKTUR + offset;
      return String.fromCharCode(PREFIX_CODE) + String.fromCharCode(transformedIndex);
    }
    else if (letterCharCode >= charCode_a && letterCharCode <= charCode_z) {
      // lowercase. do something similar...
      var offset = letterCharCode - charCode_a;
      // offset the transformed index by another 26 to make it lowercase
      var transformedIndex = FIRST_FRAKTUR + 26 + offset;
      return String.fromCharCode(PREFIX_CODE) + String.fromCharCode(transformedIndex);
    }
    else {
      // not alphabetical; don't change
      return letter;
    }
  });

  return transformedLetters.join("");
}
