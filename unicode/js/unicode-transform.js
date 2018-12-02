$(function(){
  console.log("SUP");


  $('#transform-button').on('click', function(){
    // convert input text (in markdown) to an AST
    let ast = parse($('#input-text').val());

    console.log("AST", ast);

    if (ast != null) {
      // ultimately, convert each node into raw text then smoosh it all together
      var textChildren = _.map(ast, function(node){
        return textFromAST(node, []);
      });
      // smoosh all textual children into a string
      console.log(textChildren.join(""));
    }
  });
});

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
      return "<b>" + text + "</b>";
    }
    else if (transformations[0] === 'italic') {
      return "<i>" + text + "</i>";
    }
  }
  else if (transformations.length === 2){
    // assumes that if there are two they must be bold and italic
    return "<bi>" + text + "</bi>";
  }
}
