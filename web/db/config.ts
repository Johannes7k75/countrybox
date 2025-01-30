import { column, defineDb, defineTable } from 'astro:db';

const Country = defineTable({
  columns: {
    id: column.number({primaryKey: true, unique:true}),
    name: column.text(),
    capital: column.text(),
    independent: column.boolean(),
    region: column.text(),
    sunregion: column.text(),
    cca3: column.text(),
  }
})

const CallingCode = defineTable({
  columns: {
    id: column.number({primaryKey:true,unique:true}),
    code: column.text(),
    countryId: column.number({references: ()=>Country.columns.id}),
  }
})

const Tld = defineTable({
  columns: {
    id: column.number({primaryKey:true,unique:true}),
    tld: column.text(),
    countryId: column.number({references: ()=>Country.columns.id})
  }
})

const User = defineTable({
  columns: {
    id: column.number({primaryKey: true, unique:true}),
    email: column.text(),
    pwHash: column.text()
  }
})

// https://astro.build/db/config
export default defineDb({
  tables: {Country,CallingCode,Tld,User}
});
