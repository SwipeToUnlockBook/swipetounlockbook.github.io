$(function() {
  // <!-- Script variables for educator and connect forms -->
  var submitted = false;
  var submitted2 = false;

  $('#edu_form')
    .on('submit', function(e) {
      $('#edu_form')
        .fadeOut(2000);
      $('#edu_form')
        .prepend('Your submission has been processed!');
    });

  $('#connect_form')
    .on('submit', function(e) {
      $('#connect_form')
        .fadeOut(2000);
      $('#connect_form')
        .prepend('Your submission has been processed!');
    });
});
