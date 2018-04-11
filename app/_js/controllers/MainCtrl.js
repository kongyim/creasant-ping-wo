exports = module.exports = ()=> {

  class MainCtrl {
    name = "Ka Ming"
    nameList = [
      {
        name: "Gilbert"
      },
      {
        name: "Kong"
      }
    ]

    constructor() {

    }

    add(name) {
      this.nameList.push({name: name})
    }

    remove(index) {
      this.nameList.splice(index, 1)
    }
  }

  return new MainCtrl()
}