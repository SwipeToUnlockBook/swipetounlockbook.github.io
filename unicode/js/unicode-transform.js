$(function(){
  $('#transform-button').on('click', function(){
    runTransformation($('#input-text').val());
  });

  $('#demo-button').on('click', function(){
    var demoText = "We shall go **boldly** into _Italy_ (won't that be **_so much fun?_**)";
    // put the text in input...
    $('#input-text').val(demoText);
    // and run the transformation so it goes to the output
    runTransformation(demoText);
  });
});

/*
  Transforms the given markdown text and puts the output in the UI.
*/
function runTransformation(text) {
  // convert to a markdown AST so we can transform the text to bold/italic
  let ast = markdownAST.parse(text);

  console.log("AST", ast);

  if (ast != null) {
    // ultimately, convert each node into raw text then smoosh it all together
    var textChildren = _.map(ast, function(node){
      return textFromAST(node, []);
    });
    // smoosh all textual children into a string and output it
    var output = textChildren.join("");

    $('#output-text').val(output);
  }
}

/**
  Turns a given AST node into raw text based (e.g. bolded or italiced).
  Raw text remains the same; anything with bold/italic gets converted.
  Anything else is left the same

  `transformation` is either 'bold', 'italic', or null/undefined.
*/
function textFromAST(node, transformations) {
  if (!transformations) {
    transformations = [];
  }

  // console.log(node, transformations);

  if (node.type === "text") {
    // base case
    // convert all the text here with the given transformations, if any
    return transform(node.text, transformations);
  }
  else if (node.block && node.block.length > 0){
    // this node has other nodes inside it
    // convert each node inside it, applying the style of this parent block
    var textChildren = _.map(node.block, function(block){
      // make a copy of the transformations array first with slice()
      // console.log("OLD", transformations);
      var newTransformations = transformations.slice();
      newTransformations.push(node.type);
      // console.log("NEW", newTransformations);
      return textFromAST(block, newTransformations)
    });
    // smoosh textual children into a single string
    return textChildren.join("");
  }
}

/**
  Turns the given raw text either bold or italic or nothing, depending on what
  `transformations` contains.
  Transformations is an array of all the transformations to make (`bold`, `italic`);
  pass [] or null if there are no transformations.
  We support either [], ['bold'], ['italic'], or ['bold','italic'].
*/
function transform(text, transformations) {
  if (!transformations || transformations.length === 0) {
    // no transformations
    return text;
  }
  else if (transformations.length === 1) {
    if (transformations[0] === 'bold') {
      return fonthacks.toggleBold(text);
    }
    else if (transformations[0] === 'italic') {
      return fonthacks.toggleItalic(text);
    }
  }
  else if (transformations.length >= 2){
    // assumes that if there are 2 they must be bold and italic
    // (and if there are 2+, there must be some deep nesting going on)
    return fonthacks.toggleBold(fonthacks.toggleItalic(text));
  }
}
