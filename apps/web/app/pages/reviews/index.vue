<script setup lang="ts">
const { t } = useT()
const { user } = useAccount()
</script>
<template>
  <div>
    <header class="page-head">
      <p class="eyebrow">{{ t('reviews.spacedReview') }}</p>
      <h1 class="display">{{ t('reviews.makeIt') }} <em>{{ t('reviews.stay') }}</em>.</h1>
      <p class="lede">{{ t('reviews.eachCardClimbsACompartment') }}</p>
    </header>
    <ReviewBoard v-if="user" />
    <section v-else class="due-banner">
      <div class="db-copy">
        <p class="eyebrow">{{ t('reviews.needsAnAccount') }}</p>
        <h2 class="serif">{{ t('reviews.yourBoxTravelsWithYou') }}</h2>
        <p>{{ t('reviews.reviewsAreScheduledOnThe') }}</p>
      </div>
      <NuxtLink to="/account" class="btn primary on-dark"
        >{{ t('reviews.createAFreeAccount') }}<Icon name="arrow"
      /></NuxtLink>
    </section>
  </div>
</template>
