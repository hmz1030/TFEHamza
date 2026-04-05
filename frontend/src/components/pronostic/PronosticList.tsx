import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPronostic } from '../../services/pronosticService'
import type { Pronostic } from '../../types'

interface PronosticListProps {
    pronostics: Pronostic[]
    loading: boolean
    error: string | null
    refetch: () => void
}

function PronosticList(){
    
}
