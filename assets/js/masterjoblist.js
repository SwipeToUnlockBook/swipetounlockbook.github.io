/**
  This script runs on the Master Job List page
*/
$(function(){
  // Handle selection of the job type dropdown
  $("#job-type-select").on("change", function(){
    var selectedValue = $(this).find("option:selected").val();
    console.log("Selected type:", selectedValue);

    if (selectedValue === "All") {
      resetFilters();
    }
    else {
      filterJobsByAttribute("type", selectedValue);
    }
  });
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
  $('.job-block').each(function(){
    $(this).toggle($(this).data(attribute) === value);
  });
}

function resetFilters(){
  $('.job-block').show();
}
