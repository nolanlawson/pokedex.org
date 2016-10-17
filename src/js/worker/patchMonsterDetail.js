import 'regenerator-runtime/runtime';
import renderDetailView from '../shared/renderMonsterDetailView/index';
import dbService from './databaseService';
import diff from 'virtual-dom/diff';
import Stopwatch from '../shared/util/stopwatch';
import fromJson from 'vdom-as-json/fromJson';
import bulbasaur from '../shared/prerendered/bulbasaur.json';
var lastDetailView = fromJson(bulbasaur);

export default async nationalId => {
  var stopwatch = new Stopwatch('patchMonsterDetail()');
  stopwatch.start('getFullMonsterDataById()');
  var fullMonsterData = await dbService.getFullMonsterDataById(nationalId);
  stopwatch.time('renderDetailView()');

  var newDetailView = renderDetailView(fullMonsterData);

  stopwatch.time('diff()');

  var patch = diff(lastDetailView, newDetailView);

  lastDetailView = newDetailView;

  stopwatch.totalTime();
  return {patch};
};
