import Navigo from 'navigo';
var router = new Navigo(null, true);
import worker from '../shared/worker';
import detailViewOrchestrator from './detailViewOrchestrator';

var lastNationalId;
var landedOnMainView;

router.on('/pokemon/:nationalId', params => {
  var nationalId = parseInt(params.nationalId, 10);
  worker.postMessage({
    type: 'detail',
    nationalId: nationalId
  });
  detailViewOrchestrator.animateInPartOne(nationalId);
  lastNationalId = nationalId;
}).on('/', () => {
  landedOnMainView = true;
  if (typeof lastNationalId === 'number') { // not initial load
    detailViewOrchestrator.animateOut(lastNationalId);
  }
}).resolve();

function toMonsterDetail(nationalId) {
  router.navigate('/pokemon/' + nationalId);
}

function toMainView() {
  if (landedOnMainView) {
    history.back();
  } else { // didn't land on main view, don't do a back action
    router.navigate('/');
  }
}

export {
  toMonsterDetail,
  toMainView
};