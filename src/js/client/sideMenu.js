document.addEventListener('DOMContentLoaded', () => {
  var $ = document.querySelector.bind(document);
  var sideDrawer = $('#sidedrawer');

  function showSidedrawer() {
    // show overlay
    var options = {
      onclose: () => {
        sideDrawer.classList.remove('active');
        document.body.appendChild(sideDrawer);
      }
    };

    var overlay = mui.overlay('on', options);

    // show element
    overlay.appendChild(sideDrawer);
    setTimeout(() => sideDrawer.classList.add('active'), 20);
  }

  function hideSidedrawer() {
    document.body.classList.toggle('hide-sidedrawer');
  }

  $('.js-show-sidedrawer').addEventListener('click', showSidedrawer);
  $('.js-hide-sidedrawer').addEventListener('click', hideSidedrawer);
});