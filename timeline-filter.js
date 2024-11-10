class TimelineFilter {
  constructor (source, groupBy) {
      this.source = source
      this.groupBy = groupBy
      this.loadData()
  }

  loadData () {
      window.fetch(this.source)
      .then(response => response.json())
      .then(jsondata => {
          this.data = jsondata
          this.findGroups()
      })
  }

  findGroups () {
    // find all the group values
    let allvals = this.data.features.map(f => f.properties[this.groupBy])
    // store array of unique group values
    this.groups = [...new Set(allvals)]
    // timeline of first group
    if (this.groups.length > 0) {
      this.filterData(this.groups[0])
      this.createTimeline(this.filtered)
    }
  }

  filterData (value) {
      // deep copy the data (no shared references)
      this.filtered = JSON.parse(JSON.stringify(this.data))

      this.filtered.value = value
      this.filtered.features = timeline.filtered.features.filter(x => x.properties[this.groupBy] === value)
  }

  createTimeline(data) {
      // get titles from the data to use as timeline labels
      let titles = data.features.map(x => x.properties.title)
      if (this.control) {
          this.control.remove()
      }
      this.control = L.control.timelineSlider({
          timelineItems: titles, 
          changeMap: this.updateMarkers,
          position: 'bottomleft',
          backgroundOpacity: 1,
          inactiveColor: '#444',
          activeColor: '#04f',
          caller: this
      }).addTo(mymap)
  }

  updateMarkers({label, value, map}) {
      let tf = this.caller
      // remove any previous markers
      map.eachLayer(function (layer) {
          if (layer instanceof L.Marker) {
              map.removeLayer(layer);
          }
      });
      // get the selected timeline entry
      // (subtracting 1 because timeline-slider starts at 1 instead of 0)
      tf.selected = tf.filtered.features[value-1]
      let item // this will hold the created layer
      L.geoJson(tf.selected, {
          onEachFeature: function onEachFeature(feature, layer) {
              let p = feature.properties
              let content = `<h2>${p.title}</h2>${p.location}, ${p.date}<p>${p.description}</p>`
              let popup = L.popup().setContent(content);
              layer.bindPopup(popup)

              // store this leaflet layer in the TimelineFilter
              tf.selected.layer = layer
          }
      }).addTo(map);
      
      // update the person's name at top of page
      document.querySelector('#person').innerHTML = tf.selected.properties.person
      // fly to the location -- 2nd param is zoom level, duration in seconds
      map.flyTo(tf.selected.layer.getLatLng(), 4, { duration: 2})

      // automatically show the info for this item
      tf.selected.layer.openPopup()
    }

}