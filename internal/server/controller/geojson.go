package controller

import "country-box/internal/database/repo"

type GeoJsonController struct {
	GeoJsonRepo *repo.GeoJsonRepo
}

func NewGeoJsonController(geoJsonRepo *repo.GeoJsonRepo) *GeoJsonController {
	return &GeoJsonController{
		GeoJsonRepo: geoJsonRepo,
	}
}
