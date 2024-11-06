import {BusinessCRUDSchema, BusinessIdSchema, BusinessSchema} from '@i/core/business'
import {fail, redirect} from '@sveltejs/kit'
import {superValidate} from 'sveltekit-superforms'
import {valibot} from 'sveltekit-superforms/adapters'
import * as v from 'valibot'

import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async ({parent}) => {
	const {business} = await parent()

	// No ID = new business form
	if (!business) {
		const businessForm = await superValidate(valibot(BusinessCRUDSchema))

		return {businessForm}
	}

	const businessForm = await superValidate(business, valibot(BusinessCRUDSchema))

	return {business, businessForm}
}

export const actions = {
	create: async ({locals, request}) => {
		const form = await superValidate(request, valibot(BusinessCRUDSchema))

		if (!form.valid) {
			return fail(400, {form})
		}

		// Create new business
		let business
		try {
			business = await locals.container.businessService.create(form.data)
		} catch (error) {
			console.error(error)
			return fail(500, {form})
		}

		return redirect(301, `/admin/business/${business.id.toString()}`)
	},

	delete: async ({locals, request}) => {
		const formData = await request.formData()

		await locals.container.businessService.delete(v.parse(BusinessIdSchema, formData.get('id')))

		return redirect(301, '/admin/businesses')
	},

	update: async ({locals, request}) => {
		const form = await superValidate(request, valibot(BusinessCRUDSchema))

		if (!form.valid) {
			console.error(form.errors)
			return fail(400, {form})
		}

		if (v.is(BusinessSchema, form.data)) {
			// Update existing business
			try {
				await locals.container.businessService.update(form.data)
			} catch (error) {
				console.error(error)
				return fail(500, {form})
			}
		} else {
			// Invalid
			throw new Error('Invalid business data in update')
		}
	},
} satisfies Actions
