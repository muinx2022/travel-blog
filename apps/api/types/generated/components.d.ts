import type { Schema, Struct } from '@strapi/strapi';

export interface HotelAmenity extends Struct.ComponentSchema {
  collectionName: 'components_hotel_amenities';
  info: {
    displayName: 'Amenity';
    icon: 'star';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HotelRoomType extends Struct.ComponentSchema {
  collectionName: 'components_hotel_room_types';
  info: {
    displayName: 'Room Type';
    icon: 'bed';
  };
  attributes: {
    amenities: Schema.Attribute.Text;
    available: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    description: Schema.Attribute.Text;
    images: Schema.Attribute.Media<'images' | 'videos', true>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal;
    videoUrl: Schema.Attribute.String;
  };
}

export interface TourItineraryDay extends Struct.ComponentSchema {
  collectionName: 'components_tour_itinerary_days';
  info: {
    displayName: 'Itinerary Day';
    icon: 'calendar';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'hotel.amenity': HotelAmenity;
      'hotel.room-type': HotelRoomType;
      'tour.itinerary-day': TourItineraryDay;
    }
  }
}
