$(function(){
  // $('#transform-button').on('click', function(){
  //   runTransformation($('#input-text').val());
  //
  //   // testr
  //   console.log("TESTR", transform2($('#input-text').val()));
  // });

  // no need for the convert button actually
  // auto-translate the input every time the text area changes
  $('#input-text').on('input', function() {
    var input = $('#input-text').val();
    var output = transform2(input);
    $('#output-text').val(output);
  });

  $('#demo-button').on('click', function(){
    var demoText = "We shall go **boldly** into _Italy_ (won't that be **_so much fun?_**)";
    // put the text in input...
    $('#input-text').val(demoText);
    // and run the transformation so it goes to the output
    runTransformation(demoText);
  });
});

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
