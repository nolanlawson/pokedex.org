document.addEventListener('DOMContentLoaded', function () {
  var $ = document.querySelector.bind(document);
  var sideDrawer = $('#sidedrawer');

  // ==========================================================================
  // Toggle Sidedrawer
  // ==========================================================================
  function showSidedrawer() {
    // show overlay
    var options = {
      onclose: function() {
        sideDrawer.classList.remove('active');
        document.body.appendChild(sideDrawer);
      }
    };

    var overlay = mui.overlay('on', options);

    // show element
    overlay.appendChild(sideDrawer);
    setTimeout(function() {
      sideDrawer.classList.add('active');
    }, 20);
  }


  function hideSidedrawer() {
    document.body.classList.toggle('hide-sidedrawer');
  }

  $('.js-show-sidedrawer').addEventListener('click', showSidedrawer);
  $('.js-hide-sidedrawer').addEventListener('click', hideSidedrawer);
});