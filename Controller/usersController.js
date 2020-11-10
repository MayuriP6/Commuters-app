const multer=require('multer')
const sharp=require('sharp');
const asyncError = require('./../utils/asyncError.js');
const AppError = require('../utils/appError.js');
const User = require('./../Models/userModel.js');
const factory = require('./handlerFactory.js');

//--to store the image in disk storage(wihtout processing)
/*const multerStorage=multer.diskStorage({ //to store the image in an img folder
  destination:(req,file,cb)=>{
    cb(null,'public/img/users') 
  },
  filename:(req,file,cb)=>{
    const ext=file.mimetype.split('/')[1]  //for better understanding console 'req.file' to see the keys & properties of obj
    cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
  }
})*/
const multerStorage=multer.memoryStorage()

const multerFilter=(req,file,cb)=>{ //in this we need to check whether the uploaded file is an image or not
//whatever may be the type of image,the mimetype will always start with an image word ,if its a immage else it wont start
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb(new AppError('Not an image.Please upload only the image',400),false)
  }
} 
const upload= multer({
  storage:multerStorage,
  fileFilter:multerFilter
})

exports.uploadUserPhoto=upload.single('photo')

exports.resizeUserPhoto=asyncError(async(req,res,next)=>{
  if (!req.file) return next()
  /*when we want to do image processing ,it is best to store the image in memory,process it and then store it.
  rather than storing it in storage first*/
  /*in memory  the image is stored in buffer*/
  //when we store the image in memory the file doesnot have a filename.SO we manually have to set it ,so that later we can use this field in updateMe method
  req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`
  await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.filename}`)
  next()
})

/*const filterObj = (Obj, ...allowedFields) => {
  //allowedFields is an array of name and email
  const newObj = {};
  Object.keys(Obj).forEach((el) => {
    //loop throught the keys in Object
    if (allowedFields.includes(el)) {
      newObj[el] = Obj[el];
    }
    return newObj;
  });
};*/
exports.updateMe = asyncError(async (req, res, next) => {
  //1)CREATE ERROR IF USER POSTS PASSSWORD DATA
  /*if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "Password update not allowed.To update the password visit the route '/updatePassword'",
        401
      )
    );
  }
  //2)UPDATE THE USER DOCUMENT
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });*/
  
  //console.log(req.file)
  //console.log(req.body)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "Password update not allowed.To update the password visit the route '/updatePassword'",
        401
      )
    );
  }
  const user = await User.findById(req.user.id);
  console.log(user);
  user.name = req.body.name ? req.body.name : req.user.name;
  user.email = req.body.email ? req.body.email : req.user.email;
  user.role = req.user.role;
  user.id = req.user.id;
  if(req.file){
    user.photo=req.file.filename
  }
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = asyncError(async (req, res, next) => {
  await User.findOneAndUpdate(req.user.id, { active: false });
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.ide = req.user.id; //doing this so that we can use getAUser method bcz rest of the code is same.
  next();
};

exports.getAllUsers = factory.getAll(User);

//signup fn will be used to create a user
exports.postAUser = (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'Please use signup to register yourself',
  });
};

exports.getAUser = factory.getOne(User);

//no password update bcz findByIdndUpdate in this method does not work for save middleware
exports.updateAUser = factory.updateOne(User);
exports.deleteAUser = factory.deleteOne(User);
