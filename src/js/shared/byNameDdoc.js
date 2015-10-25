module.exports = {
  _id: '_design/by-name',
  views: {
    'by-name': {
      map: function (doc) {
        emit(doc.name.toLowerCase());
      }.toString()
    }
  }
};