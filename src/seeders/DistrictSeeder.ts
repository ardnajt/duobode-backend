import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import District from '@modules/district/district.entity';
import Region from '@modules/region/region.entity';

// npx mikro-orm seeder:run --class=DistrictSeeder

export class DistrictSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const central = em.create(Region, { name: 'Central' });
    const centralPlanningAreas = [
      'Central Area (City centre)', 'Bishan', 'Bukit Merah', 'Bukit Timah', 'Downtown Core', 'Geylang',
      'Kallang', 'Marina East', 'Marina South', 'Marine Parade', 'Museum', 'Newton', 'Novena',
      'Orchard', 'Outram', 'Queenstown', 'River Valley', 'Rochor', 'Singapore River',
      'Southern Islands', 'Straits View', 'Tanglin', 'Toa Payoh'
    ];
    centralPlanningAreas.forEach(name => em.create(District, { region: central, name }));

    const east = em.create(Region, { name: 'East' });
    const eastPlanningAreas = ['Bedok', 'Changi', 'Changi Bay', 'Pasir Ris', 'Paya Lebar', 'Tampines'];
    eastPlanningAreas.forEach(name => em.create(District, { region: east, name }));

    const north = em.create(Region, { name: 'North' });
    const northPlanningAreas = [
      'Central Water Catchment', 'Lim Chu Kang', 'Mandai', 'Sembawang', 'Simpang',
      'Sungei Kadut', 'Woodlands', 'Yishun'
    ];
    northPlanningAreas.forEach(name => em.create(District, { region: north, name }));

    const northeast = em.create(Region, { name: 'North-East' });
    const northeastPlanningAreas = [
      'Ang Mo Kio', 'Hougang', 'North-Eastern Islands', 'Punggol', 'Seletar', 'Sengkang', 'Serangoon'
    ];
    northeastPlanningAreas.forEach(name => em.create(District, { region: northeast, name }));

    const west = em.create(Region, { name: 'West' });
    const westPlanningAreas = [
      'Boon Lay', 'Bukit Batok', 'Bukit Panjang', 'Choa Chu Kang', 'Clementi', 'Jurong East',
      'Jurong West', 'Pioneer', 'Tengah', 'Tuas', 'Western Islands', 'Western Water Catchment'
    ];
    westPlanningAreas.forEach(name => em.create(District, { region: west, name }));
  }

}
