import axios from "axios"
import { showAlert } from "./alert"

const stripe=Stripe('pk_test_51HksJcFXMCFNWQBJJpK7PxOkyz4fP6TShitKG7u6rGLdJ6dlNfHe6qSp8dexXvAHujqruaNrhg1Z6iQZcXgnvXLb00XNZeFlAx')
//this stripe is an object that is created using script of stripe  (tour.pug line 4) 

export const bookTour=async tourId=>{
    try{
    //1)Get checkout session from API
    const session=await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`)
    console.log(session)
    //2)Create checkout session +  charge credit card
    await stripe.redirectToCheckout({
        sessionId:session.data.session.id
    })
}catch(err){
    console.log(err)
    showAlert('error',err)
}
}