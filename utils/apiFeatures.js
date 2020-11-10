class apiFeatures {
  constructor(TourFind, reqQuery) {
    this.TourFind = TourFind;
    this.reqQuery = reqQuery;
  }
  filter() {
    //1A)   FILTERING
    let queryObj = { ...this.reqQuery };

    const excludeElement = ['page', 'sort', 'limit', 'fields'];
    excludeElement.forEach((el) => delete queryObj[el]);
    //1B)ADVANCED FILTERING  --
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (element) => `$${element}`
    );
    queryObj = JSON.parse(queryString);
    this.TourFind = this.TourFind.find(queryObj);
    return this; //this returns the entire obj
  }

  sort() {
    if (this.reqQuery.sort) {
      console.log(this.reqQuery.sort);
      let sortBy = this.reqQuery.sort.replace(',', ' '); //can even use sort.split(',',' ')
      this.TourFind = this.TourFind.sort(sortBy);
    } else {
      this.TourFind = this.TourFind.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.reqQuery.fields) {
      const field = this.reqQuery.fields.split(',').join(' ');
      console.log(field);
      this.TourFind = this.TourFind.select(field);
    } else {
      this.TourFind = this.TourFind.select('-__v'); //- sign in select means excluding
    }
    return this;
  }
  paginate() {
    const page = this.reqQuery.page * 1 || 1; //default value is 1 and so reprsented by ||1
    const limit = this.reqQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.TourFind = this.TourFind.skip(skip).limit(limit);
    return this;
  }
}

module.exports = apiFeatures;
