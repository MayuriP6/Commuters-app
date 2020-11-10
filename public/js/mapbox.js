
export const displayMap=(locations)=>{
    mapboxgl.accessToken = 'pk.eyJ1IjoibWF5dXJpMTIzIiwiYSI6ImNraGFmM25qOTFkcXYyd281YW9lMHFqYzkifQ.60Vjzaw5wA4q7ym0BuJbEw';
    var map = new mapboxgl.Map({
        container: 'map', //this map is the id from section -> of tour.pug
        style: 'mapbox://styles/mayuri123/ckhahfuzj0mk419tb4puclxmd',
       // scrollZoom:false,
        // center:[-118.113491,34.111745],
         //zoom:13,
         interactive:false
    });
    const bounds=new mapboxgl.LngLatBounds()
    locations.forEach(loc => {
        //create marker
        const el=document.createElement('div')
        el.className='marker'
        //add marker
        new mapboxgl.Marker({
            element:el,
            anchor:'bottom'
        }).setLngLat(loc.coordinates).addTo(map)
    
        //add popup
        new mapboxgl.Popup({
            offset :30
        }).setLngLat(loc.coordinates).setHTML(`<p>${loc.day}:${loc.description}</p>`).addTo(map)
        //extends map bounds to include current location
        bounds.extend(loc.coordinates)
    });
    map.fitBounds(bounds,{
        padding:{top:200,
        bottom:200,
        left:100,
        right:100
        }
    })
}