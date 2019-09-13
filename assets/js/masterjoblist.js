/**
  This script runs on the Master Job List page
*/
$(function(){
});

/**
  Apply a filter to all jobs based on a certain attribte.
  Available attributes:
  - `type`: "PM", "Sales", etc.
  - `technical`: "0", "1"
  - `rotational`: "0", "1"

  TODO: support multiple filters
*/
function filterJobsByAttribute(attribute, value){
  // hide all jobs where its `attribute` is not `value`, and show the rest
  $('.job-block').toggle(function(){
    // TODO im doing this wrong i think
    return $(this).data(attribute) === value
  });
}

function resetFilters(){
  $('.job-block').show()
}
