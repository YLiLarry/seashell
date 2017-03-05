import "jest";
import {Store, File, Project} from "../src/helpers/storage";
import J = require("jscheck");
import FakeIndexedDB = require("fake-indexeddb");
import FDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");
import Dexie from "dexie";
import {map, filter, flatten, repeat, head, prop} from "ramda";
import R = require("ramda");
import md5 = require("md5");

let unique = 0;

function uniqStr(len: number): () => string {
  return () => {
    return J.string(J.number(0, len), J.character())() + (++unique);
  };
}

describe("Testing storage.js", () => {

  const store: Store = new Store("y667li", {
    IDBKeyRange: FDBKeyRange,
    indexedDB: FakeIndexedDB
  });

  let projs: string[] = J.array(10, uniqStr(30))();
  projs.sort();

  let files: File[] = map((p) => {
    return {
      project: p,
      name: uniqStr(30)(),
      contents: uniqStr(5000)()
    };
  }, flatten(repeat(projs, 10));

  it("newProject: create 10 projects", async () => {
    for (const p of projs) {
      await store.newProject(p);
    }
  });

  it("updateProject: update last_visited", async () => {
    for (const p of projs) {
      await store.updateProject({
        name: p
      });
    }
  });

  it("getProjects: list all projects", async () => {
    const ls: Project[] = await store.getProjects();
    const dbProjs = map(prop('name'),ls).sort();
    expect(dbProjs).toEqual(projs);
  });

  it("newFile: create 100 files", async () => {
    for (const f of files) {
      await store.newFile(f.project, f.name, f.contents, '', true, '');
    }
  });

  const projGps = R.groupBy((x:File) => x.project, files);

  it("listProject: list files per project", async () => {
    for (const p of projs) {
      let dbFiles: File[] = await store.listProject(p);
      let projFiles       = projGps[p];
      dbFiles   = R.sortBy(prop("name"), dbFiles);
      projFiles = R.sortBy(prop("name"), projFiles);
      function cmp(x: File) {
        return [x.name, x.project, x.contents];
      }
      expect(map(cmp, dbFiles)).toEqual(map(cmp, projFiles));
    }
  });

  it("readFile: read all files", async () => {
    for (const f of files) {
      const r = await store.readFile(f.project, f.name);
      expect(f.name).toEqual(r.name);
      expect(f.project).toEqual(r.project);
      expect(f.contents).toEqual(r.contents);
    };
  });

  it("writeFile: update all files", async () => {
    for (let f of files) {
      f.contents = uniqStr(5000)();
      const s = await store.writeFile(f.project, f.name, f.contents, "", "");
      // const r = await store.readFile(f.project, f.name);
      // expect(f.name).toEqual(r.name);
      // expect(f.project).toEqual(r.project);
      // expect(f.contents).toEqual(r.contents);
    }
  });

  it("deleteFile: delete 2 files per project", async () => {
    for (let p in projGps) {
      await store.deleteFile(p, projGps[p][0].name, false);
      await store.deleteFile(p, projGps[p][1].name, false);
    }
  });

  it("deleteProject: delete 5 projects and children", async () => {
    var toDelete = projs
    for (let p of projs) {
      await store.deleteProject(p, false);
    }
  });

});


