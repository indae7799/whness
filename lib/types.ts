/**
 * 공통 타입 정의
 * 
 * 목적: 프로젝트 전반에서 사용되는 타입들을 중앙에서 관리
 * 사용법: import type { Persona, KeywordData } from '@/lib/types'
 */

/**
 * 페르소나 정보
 * PRD의 Feature 1에서 사용되는 사용자 페르소나 정의
 */
export interface Persona {
  age: number
  location: string
  situation: string
  budget: string
  experience: string
  tone: string
}

/**
 * 키워드 데이터
 * 리서치 결과로 수집된 키워드의 메트릭 정보
 */
export interface KeywordData {
  phrase: string
  score: number
  searchVolume?: number
  competition: number
  relevance: number
  trending: 'increasing' | 'stable' | 'decreasing'
  redditPosts: number
  sePosts: number
  snippetChance: number
}

/**
 * 리서치 소스 타입
 */
export type ResearchSource = 
  | 'reddit' 
  | 'stackexchange' 
  | 'trends' 
  | 'wikipedia' 
  | 'rss' 
  | 'autocomplete'

/**
 * WordPress 발행 옵션
 */
export interface PublishOptions {
  publishType: 'immediate' | 'scheduled'
  scheduledDate?: Date
  categories: number[]
  tags: string[]
  autoShare?: boolean
}

/**
 * WordPress 인증 정보
 */
export interface WPCredentials {
  username: string
  appPassword: string
}
